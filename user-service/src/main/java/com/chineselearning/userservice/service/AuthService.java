package com.chineselearning.userservice.service;

import com.chineselearning.userservice.domain.Credential;
import com.chineselearning.userservice.domain.Student;
import com.chineselearning.userservice.domain.Teacher;
import com.chineselearning.userservice.domain.User;
import com.chineselearning.userservice.domain.dao.ICredentialDao;
import com.chineselearning.userservice.domain.dto.AuthRequestDto;
import com.chineselearning.userservice.domain.dto.AuthResponseDto;
import com.chineselearning.userservice.domain.dto.RegisterRequestDto;
import com.chineselearning.userservice.domain.dto.RegisterResponseDto;

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
public class AuthService
{

    private final ICredentialDao credentialDao;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final AuthenticationManager authenticationManager;

    public AuthService(ICredentialDao credentialDao, PasswordEncoder passwordEncoder, JwtService jwtService, CustomUserDetailsService userDetailsService, AuthenticationManager authenticationManager)
    {
        this.credentialDao = credentialDao;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.authenticationManager = authenticationManager;
    }


    @Transactional
    public RegisterResponseDto register(RegisterRequestDto request)
    {
        // Verificam daca emailul este deja inregistrat
        if (credentialDao.existsByEmail(request.getEmail()))
        {
            throw new IllegalArgumentException("Email already registered");
        }

        // La register public sunt acceptate toate cele 3 roluri
        if (!request.getRole().equals("STUDENT") && !request.getRole().equals("TEACHER") && !request.getRole().equals("ADMIN"))
        {
            throw new IllegalArgumentException("Role must be STUDENT, TEACHER or ADMIN");
        }

        // Construim entitatea Credential cu parola hash-uita
        Credential credential = new Credential();
        credential.setEmail(request.getEmail());
        credential.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        credential.setRole(request.getRole());
        credential.setCreatedAt(LocalDateTime.now());

        // Construim entitatea User
        User user = new User();
        user.setFullName(request.getFullName());
        user.setCredential(credential);
        credential.setUser(user);

        // Cream entitatea specifica rolului
        if (request.getRole().equals("STUDENT"))
        {
            Student student = new Student();
            student.setNickname(null);
            student.setUser(user);
            user.setStudent(student);
        }
        else if (request.getRole().equals("TEACHER"))
        {
            Teacher teacher = new Teacher();
            teacher.setTitle("");
            teacher.setUser(user);
            user.setTeacher(teacher);
        }

        Credential savedCredential = credentialDao.save(credential);

        return new RegisterResponseDto(
                savedCredential.getId(),
                savedCredential.getRole(),
                savedCredential.getUser().getFullName()
        );
    }

    public AuthResponseDto login(AuthRequestDto request)
    {
        // AuthenticationManager verifica email + parola folosind CustomUserDetailsService
        // Arunca BadCredentialsException automat daca credentialele sunt invalide
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // Incarcam Credential din DB pentru a extrage datele necesare token-ului
        Credential credential = credentialDao.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(credential.getEmail());

        // Adaugam userId si role ca extra claims in payload-ul JWT
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", credential.getId());
        extraClaims.put("role", credential.getRole());
        String token = jwtService.generateToken(extraClaims, userDetails);

        return new AuthResponseDto(
                token,
                credential.getId(),
                credential.getRole(),
                credential.getUser().getFullName()
        );
    }
}