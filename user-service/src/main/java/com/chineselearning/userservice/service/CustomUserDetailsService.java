package com.chineselearning.userservice.service;

import com.chineselearning.userservice.domain.Credential;
import com.chineselearning.userservice.domain.dao.ICredentialDao;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final ICredentialDao credentialDao;

    public CustomUserDetailsService(ICredentialDao credentialDao)
    {
        this.credentialDao = credentialDao;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Credential credential = credentialDao.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        return new org.springframework.security.core.userdetails.User(
                credential.getEmail(),
                credential.getPasswordHash(),
                List.of(new SimpleGrantedAuthority("ROLE_" + credential.getRole()))
        );
    }
}