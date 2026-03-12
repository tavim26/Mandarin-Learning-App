package com.chineselearning.chatbotservice.controller;

import com.chineselearning.chatbotservice.domain.dto.*;
import com.chineselearning.chatbotservice.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


// http://localhost:8084/swagger-ui/index.html

@RestController
@RequestMapping("/api/chatbot")
public class ChatController
{

    private final ChatService chatService;

    public ChatController(ChatService chatService)
    {
        this.chatService = chatService;
    }


    @PostMapping("/sessions")
    public ResponseEntity<ChatSessionDto> createSession(@Valid @RequestBody CreateSessionRequest request)
    {
        return ResponseEntity.status(HttpStatus.CREATED).body(chatService.createSession(request));
    }

    @GetMapping("/sessions/student/{studentId}")
    public ResponseEntity<List<ChatSessionDto>> getSessionsByStudent(@PathVariable Long studentId)
    {
        return ResponseEntity.ok(chatService.getSessionsByStudent(studentId));
    }

    @PatchMapping("/sessions/{sessionId}/end")
    public ResponseEntity<ChatSessionDto> endSession(@PathVariable Long sessionId)
    {
        return ResponseEntity.ok(chatService.endSession(sessionId));
    }



    // MESAJE

    @PostMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<SendMessageResponse> sendMessage(@PathVariable Long sessionId, @Valid @RequestBody SendMessageRequest request)
    {
        return ResponseEntity.status(HttpStatus.CREATED).body(chatService.sendMessage(sessionId, request));
    }

    @GetMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<List<ChatMessageDto>> getMessages(@PathVariable Long sessionId)
    {
        return ResponseEntity.ok(chatService.getMessages(sessionId));
    }
}