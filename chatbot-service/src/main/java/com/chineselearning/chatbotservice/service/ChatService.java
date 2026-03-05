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


    // --- SESIUNI ---

    @Transactional
    public ChatSessionDto createSession(CreateSessionRequest request)
    {
        ChatSession session = new ChatSession();
        session.setStudentId(request.getStudentId());
        session.setTitle(request.getTitle());
        session.setStartedAt(LocalDateTime.now());

        return mapSessionToDto(chatSessionDao.save(session));
    }

    @Transactional(readOnly = true)
    public List<ChatSessionDto> getSessionsByStudent(Long studentId)
    {
        return chatSessionDao.findByStudentIdOrderByStartedAtDesc(studentId)
                .stream()
                .map(this::mapSessionToDto)
                .toList();
    }

    @Transactional
    public ChatSessionDto endSession(Long sessionId)
    {
        ChatSession session = chatSessionDao.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Sesiunea cu id " + sessionId + " nu exista."));

        session.setEndedAt(LocalDateTime.now());
        return mapSessionToDto(chatSessionDao.save(session));
    }



    // --- MESAJE ---

    @Transactional
    public SendMessageResponse sendMessage(Long sessionId, SendMessageRequest request)
    {
        ChatSession session = chatSessionDao.findById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Sesiunea cu id " + sessionId + " nu exista."));

        if (session.getEndedAt() != null)
        {
            throw new IllegalStateException("Sesiunea cu id " + sessionId + " este inchisa.");
        }

        // Salvam mesajul studentului
        ChatMessage userMessage = new ChatMessage();
        userMessage.setSession(session);
        userMessage.setSender("STUDENT");
        userMessage.setContent(request.getContent());
        userMessage.setCreatedAt(LocalDateTime.now());
        chatMessageDao.save(userMessage);

        // Construim fereastra de context din ultimele N mesaje (exclusiv mesajul curent)
        List<AiService.ContextMessage> context = buildContextWindow(sessionId, userMessage.getId());

        // Apelam Gemini
        String aiResponse = aiService.chat(request.getContent(), context);

        // Salvam raspunsul AI
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
    public List<ChatMessageDto> getMessages(Long sessionId)
    {
        if (!chatSessionDao.existsById(sessionId))
        {
            throw new EntityNotFoundException("Sesiunea cu id " + sessionId + " nu exista.");
        }
        return chatMessageDao.findBySessionIdOrderByCreatedAtAsc(sessionId)
                .stream()
                .map(this::mapMessageToDto)
                .toList();
    }


    // --- HELPER PRIVAT: fereastra de context ---

    // Preia ultimele N mesaje anterioare mesajului curent si le inverseaza in ordine cronologica
    private List<AiService.ContextMessage> buildContextWindow(Long sessionId, Long excludeMessageId)
    {
        List<ChatMessage> recent = chatMessageDao.findTop20BySessionIdOrderByCreatedAtDesc(sessionId)
                .stream()
                .filter(m -> !m.getId().equals(excludeMessageId))
                .limit(contextWindowSize)
                .toList();

        List<AiService.ContextMessage> context = recent.stream()
                .map(m -> new AiService.ContextMessage(m.getSender(), m.getContent()))
                .toList();

        // Inversam pentru a trimite mesajele in ordine cronologica corecta catre Gemini
        List<AiService.ContextMessage> ordered = new ArrayList<>(context);
        Collections.reverse(ordered);
        return ordered;
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