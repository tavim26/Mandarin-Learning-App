package com.chineselearning.chatbotservice.service;

import com.chineselearning.chatbotservice.domain.ChatMessage;
import com.chineselearning.chatbotservice.domain.ChatSession;

import com.chineselearning.chatbotservice.domain.dao.IChatMessageDao;
import com.chineselearning.chatbotservice.domain.dao.IChatSessionDao;

import com.chineselearning.chatbotservice.domain.dto.*;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.AccessDeniedException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class ChatService
{

    private final IChatSessionDao chatSessionDao;
    private final IChatMessageDao chatMessageDao;
    private final AiService aiService;

    @Value("${chatbot.context.window-size}")
    private int contextWindowSize;

    public ChatService(IChatSessionDao chatSessionDao, IChatMessageDao chatMessageDao, AiService aiService)
    {
        this.chatSessionDao = chatSessionDao;
        this.chatMessageDao = chatMessageDao;
        this.aiService = aiService;
    }


    // SESIUNI

    // studentId pasat explicit din controller, nu din request body
    @Transactional
    public ChatSessionDto createSession(Long studentId, CreateSessionRequest request)
    {
        ChatSession session = new ChatSession();
        session.setStudentId(studentId);
        session.setTitle(request.getTitle());
        session.setStartedAt(LocalDateTime.now());

        return mapSessionToDto(chatSessionDao.save(session));
    }

    // verificare ownership: studentul poate vedea doar propriile sesiuni
    @Transactional(readOnly = true)
    public List<ChatSessionDto> getSessionsByStudent(Long requestingStudentId)
    {
        return chatSessionDao.findByStudentIdOrderByStartedAtDesc(requestingStudentId)
                .stream()
                .map(session -> enrichSessionDto(mapSessionToDto(session)))
                .toList();
    }

    // studentId pasat din controller pentru verificarea ownership-ului
    @Transactional
    public ChatSessionDto endSession(Long sessionId, Long requestingStudentId) throws AccessDeniedException
    {
        ChatSession session = chatSessionDao.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Sesiunea cu id " + sessionId + " nu exista."));

        // doar studentul proprietar poate inchide sesiunea
        if (!session.getStudentId().equals(requestingStudentId))
        {
            throw new AccessDeniedException("Nu aveti permisiunea de a inchide aceasta sesiune.");
        }

        session.setEndedAt(LocalDateTime.now());
        return mapSessionToDto(chatSessionDao.save(session));
    }



    // MESAJE

    // studentId pasat din controller pentru verificarea ownership-ului
    @Transactional
    public SendMessageResponse sendMessage(Long sessionId, Long requestingStudentId, SendMessageRequest request) throws AccessDeniedException {
        ChatSession session = chatSessionDao.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Sesiunea cu id " + sessionId + " nu exista."));

        if (!session.getStudentId().equals(requestingStudentId))
        {
            throw new AccessDeniedException("Nu aveti permisiunea de a accesa aceasta sesiune.");
        }

        if (session.getEndedAt() != null)
        {
            throw new IllegalStateException("Sesiunea cu id " + sessionId + " este inchisa.");
        }

        ChatMessage userMessage = new ChatMessage();
        userMessage.setSession(session);
        userMessage.setSender("STUDENT");
        userMessage.setContent(request.getContent());
        userMessage.setCreatedAt(LocalDateTime.now());
        userMessage = chatMessageDao.save(userMessage);

        // daca sesiunea nu are titlu si acesta este primul mesaj, genereaza titlul automat
        if (session.getTitle() == null && chatMessageDao.countBySessionId(sessionId) == 1)
        {
            String content = request.getContent();
            String autoTitle = content.length() > 40 ? content.substring(0, 40) + "..." : content;
            session.setTitle(autoTitle);
            chatSessionDao.save(session);
        }

        List<AiService.ContextMessage> context = buildContextWindow(sessionId, userMessage.getId());

        String aiResponse = aiService.chat(request.getContent(), context);

        ChatMessage aiMessage = new ChatMessage();
        aiMessage.setSession(session);
        aiMessage.setSender("AI");
        aiMessage.setContent(aiResponse);
        aiMessage.setCreatedAt(LocalDateTime.now());
        chatMessageDao.save(aiMessage);

        SendMessageResponse response = new SendMessageResponse();
        response.setUserMessage(mapMessageToDto(userMessage));
        response.setAiMessage(mapMessageToDto(aiMessage));

        return response;
    }

    // verificare ownership: studentul poate vedea doar mesajele din propriile sesiuni
    @Transactional(readOnly = true)
    public List<ChatMessageDto> getMessages(Long sessionId, Long requestingStudentId) throws AccessDeniedException
    {
        ChatSession session = chatSessionDao.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Sesiunea cu id " + sessionId + " nu exista."));

        if (!session.getStudentId().equals(requestingStudentId))
        {
            throw new AccessDeniedException("Nu aveti permisiunea de a accesa aceasta sesiune.");
        }

        return chatMessageDao.findBySessionIdOrderByCreatedAtAsc(sessionId)
                .stream()
                .map(this::mapMessageToDto)
                .toList();
    }


    // HELPER

    private List<AiService.ContextMessage> buildContextWindow(Long sessionId, Long excludeMessageId)
    {
        // preia ultimele contextWindowSize + 1 mesaje pentru a absorbi excluderea mesajului curent
        List<ChatMessage> recent = chatMessageDao.findRecentBySessionId(sessionId, contextWindowSize + 1)
                .stream()
                .filter(m -> !m.getId().equals(excludeMessageId))
                .limit(contextWindowSize)
                .toList();

        List<AiService.ContextMessage> ordered = recent.stream()
                .map(m -> new AiService.ContextMessage(m.getSender(), m.getContent()))
                .collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));

        Collections.reverse(ordered);
        return ordered;
    }


    // Populeaza preview-ul ultimului mesaj si numarul total de mesaje pentru afisarea in sidebar
    private ChatSessionDto enrichSessionDto(ChatSessionDto dto)
    {
        int count = chatMessageDao.countBySessionId(dto.getId());
        dto.setMessageCount(count);

        if (count > 0)
        {
            List<ChatMessage> lastMessage = chatMessageDao.findRecentBySessionId(dto.getId(), 1);
            if (!lastMessage.isEmpty())
            {
                String content = lastMessage.get(0).getContent();
                // trunchiem la 60 de caractere pentru afisare in sidebar
                String preview = content.length() > 60 ? content.substring(0, 60) + "..." : content;
                dto.setLastMessagePreview(preview);
            }
        }

        return dto;
    }




    @Transactional(readOnly = true)
    public PagedResponse<ChatSessionDto> getSessionsByStudentPaged(Long requestingStudentId, int page, int size)
    {
        List<ChatSessionDto> content = chatSessionDao
                .findByStudentIdOrderByStartedAtDesc(requestingStudentId, page, size)
                .stream()
                .map(session -> enrichSessionDto(mapSessionToDto(session)))
                .toList();

        long total = chatSessionDao.countByStudentId(requestingStudentId);
        return new PagedResponse<>(content, page, size, total);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ChatMessageDto> getMessagesPaged(Long sessionId, Long requestingStudentId, int page, int size) throws AccessDeniedException {
        ChatSession session = chatSessionDao.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Sesiunea cu id " + sessionId + " nu exista."));

        if (!session.getStudentId().equals(requestingStudentId))
        {
            throw new AccessDeniedException("Nu aveti permisiunea de a accesa aceasta sesiune.");
        }

        List<ChatMessageDto> content = chatMessageDao
                .findBySessionIdOrderByCreatedAtAsc(sessionId, page, size)
                .stream()
                .map(this::mapMessageToDto)
                .toList();

        long total = chatMessageDao.countTotalBySessionId(sessionId);
        return new PagedResponse<>(content, page, size, total);
    }

    @Transactional
    public ChatSessionDto renameSession(Long sessionId, Long requestingStudentId, String newTitle) throws AccessDeniedException {
        ChatSession session = chatSessionDao.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Sesiunea cu id " + sessionId + " nu exista."));

        if (!session.getStudentId().equals(requestingStudentId))
        {
            throw new AccessDeniedException("Nu aveti permisiunea de a modifica aceasta sesiune.");
        }

        session.setTitle(newTitle);
        return mapSessionToDto(chatSessionDao.save(session));
    }

    @Transactional
    public void deleteSession(Long sessionId, Long requestingStudentId) throws AccessDeniedException {
        if (!chatSessionDao.existsByIdAndStudentId(sessionId, requestingStudentId))
        {
            // daca sesiunea nu exista deloc, 404; daca exista dar apartine altui student, 403
            if (!chatSessionDao.existsById(sessionId))
            {
                throw new EntityNotFoundException("Sesiunea cu id " + sessionId + " nu exista.");
            }
            throw new AccessDeniedException("Nu aveti permisiunea de a sterge aceasta sesiune.");
        }

        chatSessionDao.deleteById(sessionId);
    }



    // --- MAPPING  ---

    private ChatSessionDto mapSessionToDto(ChatSession session)
    {
        ChatSessionDto dto = new ChatSessionDto();
        dto.setId(session.getId());
        dto.setStudentId(session.getStudentId());
        dto.setTitle(session.getTitle());
        dto.setStartedAt(session.getStartedAt());
        dto.setEndedAt(session.getEndedAt());
        return dto;
    }

    private ChatMessageDto mapMessageToDto(ChatMessage message)
    {
        ChatMessageDto dto = new ChatMessageDto();
        dto.setId(message.getId());
        dto.setSessionId(message.getSession().getId());
        dto.setSender(message.getSender());
        dto.setContent(message.getContent());
        dto.setCreatedAt(message.getCreatedAt());
        return dto;
    }
}