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



    @Transactional
    public ChatSessionDto createSession(Long studentId, CreateSessionRequest request)
    {
        ChatSession session = new ChatSession();
        session.setStudentId(studentId);
        session.setTitle(request.getTitle());
        session.setCustomInstructions(request.getCustomInstructions());
        session.setStartedAt(LocalDateTime.now());

        return enrichSessionDto(mapSessionToDto(chatSessionDao.save(session)));

    }

    @Transactional(readOnly = true)
    public List<ChatSessionDto> getSessionsByStudent(Long requestingStudentId)
    {
        return chatSessionDao.findByStudentIdOrderByStartedAtDesc(requestingStudentId)
                .stream()
                .map(session -> enrichSessionDto(mapSessionToDto(session)))
                .toList();
    }

    @Transactional
    public ChatSessionDto endSession(Long sessionId, Long requestingStudentId) throws AccessDeniedException
    {
        ChatSession session = chatSessionDao.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Session with id" + sessionId + " does not exist."));

        if (!session.getStudentId().equals(requestingStudentId))
        {
            throw new AccessDeniedException("You don't have permission to end this session.");
        }

        session.setEndedAt(LocalDateTime.now());
        return enrichSessionDto(mapSessionToDto(chatSessionDao.save(session)));

    }




    @Transactional
    public SendMessageResponse sendMessage(Long sessionId, Long requestingStudentId, SendMessageRequest request) throws AccessDeniedException {
        ChatSession session = chatSessionDao.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Session with id" + sessionId + " does not exist."));

        if (!session.getStudentId().equals(requestingStudentId))
        {
            throw new AccessDeniedException("You don't have permission to access this session.");
        }

        if (session.getEndedAt() != null)
        {
            throw new IllegalStateException("Session with id " + sessionId + " is already ended.");
        }

        ChatMessage userMessage = new ChatMessage();
        userMessage.setSession(session);
        userMessage.setSender("STUDENT");
        userMessage.setContent(request.getContent());
        userMessage.setCreatedAt(LocalDateTime.now());
        userMessage = chatMessageDao.save(userMessage);

        if (session.getTitle() == null && chatMessageDao.countBySessionId(sessionId) == 1)
        {
            String content = request.getContent();
            String autoTitle = content.length() > 40 ? content.substring(0, 40) + "..." : content;
            session.setTitle(autoTitle);
            chatSessionDao.save(session);
        }

        List<AiService.ContextMessage> context = buildContextWindow(sessionId, userMessage.getId());

        String aiResponse = aiService.chat(request.getContent(), context, session.getCustomInstructions());

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

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getMessages(Long sessionId, Long requestingStudentId) throws AccessDeniedException
    {
        ChatSession session = chatSessionDao.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Session with id" + sessionId + " does not exist."));

        if (!session.getStudentId().equals(requestingStudentId))
        {
            throw new AccessDeniedException("You don't have permission to access this session.");
        }

        return chatMessageDao.findBySessionIdOrderByCreatedAtAsc(sessionId)
                .stream()
                .map(this::mapMessageToDto)
                .toList();
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
                .orElseThrow(() -> new EntityNotFoundException("Session with id " + sessionId + " does not exist."));

        if (!session.getStudentId().equals(requestingStudentId))
        {
            throw new AccessDeniedException("You don't have permission to access this session.");
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
                .orElseThrow(() -> new EntityNotFoundException("Session with id " + sessionId + " does not exist."));

        if (!session.getStudentId().equals(requestingStudentId))
        {
            throw new AccessDeniedException("You don't have permission to access this session.");
        }

        session.setTitle(newTitle);
        return enrichSessionDto(mapSessionToDto(chatSessionDao.save(session)));

    }

    @Transactional
    public void deleteSession(Long sessionId, Long requestingStudentId) throws AccessDeniedException {
        if (!chatSessionDao.existsByIdAndStudentId(sessionId, requestingStudentId))
        {
            if (!chatSessionDao.existsById(sessionId))
            {
                throw new EntityNotFoundException("Session with id " + sessionId + " does not exist.");
            }
            throw new AccessDeniedException("You don't have permission to access this session.");
        }

        chatSessionDao.deleteById(sessionId);
    }




    private List<AiService.ContextMessage> buildContextWindow(Long sessionId, Long excludeMessageId)
    {
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


    private ChatSessionDto enrichSessionDto(ChatSessionDto dto)
    {
        List<ChatMessage> last = chatMessageDao.findLastMessageBySessionId(dto.getId());

        if (!last.isEmpty())
        {
            String content = last.get(0).getContent();
            String preview = content.length() > 60 ? content.substring(0, 60) + "..." : content;
            dto.setLastMessagePreview(preview);
        }

        long count = chatMessageDao.countBySessionId(dto.getId());
        dto.setMessageCount(count);

        return dto;
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
        dto.setCustomInstructions(session.getCustomInstructions());
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