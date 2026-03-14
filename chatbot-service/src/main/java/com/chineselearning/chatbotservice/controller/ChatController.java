package com.chineselearning.chatbotservice.controller;

import com.chineselearning.chatbotservice.domain.dto.*;
import com.chineselearning.chatbotservice.service.ChatService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.List;


// // http://localhost:8084/swagger-ui/index.html

@RestController
@RequestMapping("/api/chatbot")
public class ChatController
{

    private final ChatService chatService;

    public ChatController(ChatService chatService)
    {
        this.chatService = chatService;
    }


    // SESIUNI

    @PostMapping("/sessions")
    public ResponseEntity<ChatSessionDto> createSession(
            @RequestHeader("X-User-Id") Long studentId,
            @RequestBody CreateSessionRequest request)
    {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(chatService.createSession(studentId, request));
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<ChatSessionDto>> getSessionsByStudent(
            @RequestHeader("X-User-Id") Long requestingStudentId)
    {
        return ResponseEntity.ok(chatService.getSessionsByStudent(requestingStudentId));
    }

    @PatchMapping("/sessions/{sessionId}/end")
    public ResponseEntity<ChatSessionDto> endSession(
            @PathVariable Long sessionId,
            @RequestHeader("X-User-Id") Long requestingStudentId) throws java.nio.file.AccessDeniedException {
        return ResponseEntity.ok(chatService.endSession(sessionId, requestingStudentId));
    }


    // MESAJE

    @PostMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<SendMessageResponse> sendMessage(
            @PathVariable Long sessionId,
            @RequestHeader("X-User-Id") Long requestingStudentId,
            @Valid @RequestBody SendMessageRequest request) throws java.nio.file.AccessDeniedException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(chatService.sendMessage(sessionId, requestingStudentId, request));
    }

    @GetMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<List<ChatMessageDto>> getMessages(
            @PathVariable Long sessionId,
            @RequestHeader("X-User-Id") Long requestingStudentId) throws AccessDeniedException {
        return ResponseEntity.ok(chatService.getMessages(sessionId, requestingStudentId));
    }


    // EXCEPTION HANDLERS

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<String> handleNotFound(EntityNotFoundException e)
    {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<String> handleIllegalState(IllegalStateException e)
    {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<String> handleAccessDenied(AccessDeniedException e)
    {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleAiUnavailable(RuntimeException e)
    {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(e.getMessage());
    }
}