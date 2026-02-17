package com.chineselearning.userservice.domain.dto;

public class StudentDto {
    private Long userId;
    private String nickname;

    public StudentDto() {}

    public StudentDto(Long userId, String nickname) {
        this.userId = userId;
        this.nickname = nickname;
    }

    // Getters and Setters
    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }
}
