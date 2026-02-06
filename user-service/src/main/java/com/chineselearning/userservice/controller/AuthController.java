package com.chineselearning.userservice.controller;

import com.chineselearning.userservice.domain.dto.AuthRequestDto;
import com.chineselearning.userservice.domain.dto.AuthResponseDto;
import com.chineselearning.userservice.domain.dto.RegisterRequestDto;
import com.chineselearning.userservice.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Endpoints for user registration and login")
public class AuthController
{

    private final AuthService authService;

    public AuthController(AuthService authService)
    {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register new user", description = "Creates a new user account (Student or Teacher) and returns JWT token")
    public ResponseEntity<?> register(@RequestBody RegisterRequestDto request)
    {
        try {
            AuthResponseDto response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    @Operation(summary = "Login user", description = "Authenticates user credentials and returns JWT token")
    public ResponseEntity<?> login(@RequestBody AuthRequestDto request)
    {
        try {
            AuthResponseDto response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }
    }
}