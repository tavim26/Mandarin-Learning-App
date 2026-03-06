package com.chineselearning.userservice.config;

import com.chineselearning.userservice.service.CustomUserDetailsService;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

// Clasa de configurare Spring Security pentru acest microserviciu
// Autorizarea pe baza de rol se face centralizat in API Gateway, nu aici
@Configuration
@EnableWebSecurity
public class SecurityConfig
{

    private final CustomUserDetailsService userDetailsService;

    public SecurityConfig(CustomUserDetailsService userDetailsService)
    {
        this.userDetailsService = userDetailsService;
    }

    // Defineste lantul de filtre HTTP aplicat fiecarui request
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception
    {
        http
                // Dezactivam CSRF deoarece folosim JWT (stateless), nu sesiuni sau cookies
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()

                        // Toate endpoint-urile sunt permise deoarece autorizarea se face in API Gateway
                        .anyRequest().permitAll()
                )
                // Nu cream sesiuni pe server; fiecare request este independent (JWT)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                );

        return http.build();
    }

    // Bean folosit pentru hash-uirea parolelor la register si verificarea lor la login
    @Bean
    public PasswordEncoder passwordEncoder()
    {
        return new BCryptPasswordEncoder();
    }

    // AuthenticationManager este folosit in AuthService la autentificarea credentialelor (login)
    // Il configuram sa foloseasca CustomUserDetailsService si BCrypt pentru verificarea parolei
    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception
    {
        AuthenticationManagerBuilder authBuilder = http.getSharedObject(AuthenticationManagerBuilder.class);

        authBuilder
                .userDetailsService(userDetailsService)
                .passwordEncoder(passwordEncoder());
        return authBuilder.build();
    }
}