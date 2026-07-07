package com.chineselearning.contentservice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

@Service
public class StorageService
{

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/gif",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "audio/mpeg",
            "audio/wav",
            "video/mp4"
    );

    private static final long MAX_FILE_SIZE_BYTES = 50L * 1024 * 1024;

    @Value("${storage.upload-dir}")
    private String uploadDir;

    @Value("${storage.base-url}")
    private String baseUrl;

    public String upload(MultipartFile file) throws IOException
    {

        if (file.getContentType() == null || !ALLOWED_TYPES.contains(file.getContentType()))
        {
            throw new IllegalArgumentException("File type not allowed: " + file.getContentType());
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES)
        {
            throw new IllegalArgumentException("The file exceeds the maximum allowed size of : " + (file.getSize() / (1024 * 1024)) + "MB.");
        }

        Path uploadPath = Paths.get(uploadDir).normalize();
        if (!Files.exists(uploadPath))
        {
            Files.createDirectories(uploadPath);
        }

        String originalName = file.getOriginalFilename();
        String safeName = (originalName != null)
                ? Paths.get(originalName).getFileName().toString()
                .replaceAll("[^a-zA-Z0-9._-]", "_")
                : "file";

        String fileName = UUID.randomUUID() + "_" + safeName;
        Path filePath = uploadPath.resolve(fileName).normalize();

        if (!filePath.startsWith(uploadPath)) {
            throw new SecurityException("Invalid file name.");
        }

        Files.write(filePath, file.getBytes());
        return baseUrl + "/api/content/files/" + fileName;
    }



    public void delete(String fileUrl)
    {
        String fileName = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);

        Path uploadPath = Paths.get(uploadDir).normalize();
        Path filePath = uploadPath.resolve(fileName).normalize();

        if (!filePath.startsWith(uploadPath))
        {
            return;
        }

        try {
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // file does not exist on disk
        }
    }


    public byte[] loadFile(String fileName) throws IOException
    {
        Path uploadPath = Paths.get(uploadDir).normalize();
        Path filePath = uploadPath.resolve(fileName).normalize();

        if (!filePath.startsWith(uploadPath))
        {
            throw new SecurityException("Access not allowed to this file.");
        }

        return Files.readAllBytes(filePath);
    }


    public String getContentType(String fileName) throws IOException
    {
        Path uploadPath = Paths.get(uploadDir).normalize();
        Path filePath = uploadPath.resolve(fileName).normalize();

        if (!filePath.startsWith(uploadPath))
        {
            throw new SecurityException("Access not allowed to this file.");
        }

        String contentType = Files.probeContentType(filePath);
        return contentType != null ? contentType : "application/octet-stream";
    }
}