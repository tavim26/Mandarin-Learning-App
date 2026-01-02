package com.chineselearning.userservice.service;

import com.chineselearning.userservice.domain.Credential;
import com.chineselearning.userservice.domain.Student;
import com.chineselearning.userservice.domain.Teacher;
import com.chineselearning.userservice.domain.User;
import com.chineselearning.userservice.domain.dao.ICredentialDao;
import com.chineselearning.userservice.domain.dto.AuthRequestDto;
import com.chineselearning.userservice.domain.dto.AuthResponseDto;
import com.chineselearning.userservice.domain.dto.RegisterRequestDto;
import com.chineselearning.userservice.events.StudentCreatedEvent;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private final ICredentialDao credentialDao;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final AuthenticationManager authenticationManager;
    private final StudentEventPublisher studentEventPublisher;

    public AuthService(
            ICredentialDao credentialDao,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            CustomUserDetailsService userDetailsService,
            AuthenticationManager authenticationManager,
            StudentEventPublisher studentEventPublisher
    ) {
        this.credentialDao = credentialDao;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.authenticationManager = authenticationManager;
        this.studentEventPublisher = studentEventPublisher;
    }

    @Transactional
    public AuthResponseDto register(RegisterRequestDto request) {
        // 1. Validate: Check if email already exists
        if (credentialDao.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        // 2. Validate: Check role
        if (!request.getRole().equals("STUDENT") &&
                !request.getRole().equals("TEACHER") &&
                !request.getRole().equals("ADMIN")) {
            throw new IllegalArgumentException("Role must be STUDENT, TEACHER or ADMIN");
        }

        // 3. Create Credential entity
        Credential credential = new Credential();
        credential.setEmail(request.getEmail());
        credential.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        credential.setRole(request.getRole());
        credential.setCreatedAt(LocalDateTime.now());

        // 4. Create User entity
        User user = new User();
        user.setFullName(request.getFullName());
        user.setCredential(credential);
        credential.setUser(user);

        // 5. Create Student or Teacher entity (ONLY if not ADMIN)
        if (request.getRole().equals("STUDENT")) {
            Student student = new Student();
            student.setXpTotal(0);
            student.setLevel(1);
            student.setUser(user);
            user.setStudent(student);
        } else if (request.getRole().equals("TEACHER")) {
            Teacher teacher = new Teacher();
            teacher.setTitle(""); // Empty by default
            teacher.setUser(user);
            user.setTeacher(teacher);
        }
        // ADMIN role: No additional entity created (only Credential + User)

        // 6. Save (cascade will save User and Student/Teacher if present)
        Credential savedCredential = credentialDao.save(credential);

        // 7. Publish StudentCreatedEvent if role is STUDENT
        if (request.getRole().equals("STUDENT")) {
            StudentCreatedEvent event = new StudentCreatedEvent(
                    savedCredential.getId(),  // studentId = userId (same via @MapsId)
                    savedCredential.getUser().getFullName(),
                    savedCredential.getEmail()
            );
            studentEventPublisher.publishStudentCreated(event);
        }

        // 8. Generate JWT token
        UserDetails userDetails = userDetailsService.loadUserByUsername(savedCredential.getEmail());
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", savedCredential.getId());
        extraClaims.put("role", savedCredential.getRole());
        String token = jwtService.generateToken(extraClaims, userDetails);

        // 9. Return response
        return new AuthResponseDto(
                token,
                savedCredential.getId(),
                savedCredential.getRole(),
                savedCredential.getUser().getFullName()
        );
    }

    public AuthResponseDto login(AuthRequestDto request) {
        // 1. Authenticate using Spring Security
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // 2. Load user details
        Credential credential = credentialDao.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(credential.getEmail());

        // 3. Generate JWT token
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", credential.getId());
        extraClaims.put("role", credential.getRole());
        String token = jwtService.generateToken(extraClaims, userDetails);

        // 4. Return response
        return new AuthResponseDto(
                token,
                credential.getId(),
                credential.getRole(),
                credential.getUser().getFullName()
        );
    }
}