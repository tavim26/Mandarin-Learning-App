package com.chineselearning.userservice.service;

import com.chineselearning.userservice.domain.Credential;
import com.chineselearning.userservice.domain.dao.ICredentialDao;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

// Clasa care face bridging intre domeniul nostru si contractul Spring Security
// Spring Security nu stie despre Credential sau ICredentialDao
// Prin implementarea UserDetailsService, ii spunem Spring Security cum sa incarce un utilizator din DB
@Service
public class CustomUserDetailsService implements UserDetailsService
{

    private final ICredentialDao credentialDao;

    public CustomUserDetailsService(ICredentialDao credentialDao)
    {
        this.credentialDao = credentialDao;
    }

    // Spring Security apeleaza aceasta metoda automat in timpul autentificarii
    // Parametrul "username" este de fapt email-ul in cazul nostru
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException
    {
        Credential credential = credentialDao.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // Construim obiectul UserDetails pe care Spring Security il va folosi intern
        // Rolul este prefixat cu "ROLE_" conform conventiei Spring Security (ex: ROLE_STUDENT)
        return new org.springframework.security.core.userdetails.User(
                credential.getEmail(),
                credential.getPasswordHash(),
                List.of(new SimpleGrantedAuthority("ROLE_" + credential.getRole()))
        );
    }
}