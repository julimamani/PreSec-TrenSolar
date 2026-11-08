package com.app.agtech.service;

import com.app.agtech.config.StorageProperties;
import com.app.agtech.exception.FileStorageException;
import com.app.agtech.exception.InvalidFileException;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");
    private static final Map<String, String> EXTENSION_BY_CONTENT_TYPE = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp"
    );

    private final Path rootLocation;
    private final String publicPath;

    public FileStorageService(StorageProperties storageProperties) {
        this.rootLocation = Paths.get(storageProperties.location())
                .toAbsolutePath()
                .normalize();
        this.publicPath = storageProperties.publicPath();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException exception) {
            throw new FileStorageException("Could not initialize storage directory " + rootLocation, exception);
        }
    }

    /**
     * Stores an uploaded image under a generated UUID filename and returns its
     * absolute path and public URL.
     */
    public StoredFile store(MultipartFile file) {
        validate(file);

        String contentType = file.getContentType().toLowerCase(Locale.ROOT);
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String extension = resolveExtension(originalFilename, contentType);
        String storedFilename = UUID.randomUUID() + "." + extension;

        Path targetLocation = rootLocation.resolve(storedFilename).normalize();
        if (!targetLocation.getParent().equals(rootLocation)) {
            throw new InvalidFileException("Invalid storage path for file " + originalFilename);
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new FileStorageException("Could not store file " + storedFilename, exception);
        }

        return new StoredFile(
                storedFilename,
                targetLocation,
                publicPath + "/" + storedFilename,
                contentType,
                file.getSize()
        );
    }

    public void delete(String storedFilename) {
        try {
            Path targetLocation = rootLocation.resolve(storedFilename).normalize();
            if (!targetLocation.getParent().equals(rootLocation)) {
                return;
            }
            Files.deleteIfExists(targetLocation);
        } catch (IOException exception) {
            throw new FileStorageException("Could not delete file " + storedFilename, exception);
        }
    }

    public Path getRootLocation() {
        return rootLocation;
    }

    /**
     * Resolves a public image URL (for example {@code /uploads/<uuid>.jpg})
     * back to its location on disk.
     */
    public Path resolvePath(String imageUrl) {
        if (imageUrl == null || !imageUrl.startsWith(publicPath + "/")) {
            throw new InvalidFileException("Invalid stored image URL");
        }

        String storedFilename = imageUrl.substring(publicPath.length() + 1);
        if (storedFilename.isBlank() || storedFilename.contains("/") || storedFilename.contains("\\")) {
            throw new InvalidFileException("Invalid stored image URL");
        }

        Path targetLocation = rootLocation.resolve(storedFilename).normalize();
        if (!targetLocation.getParent().equals(rootLocation) || !Files.isRegularFile(targetLocation)) {
            throw new InvalidFileException("Stored image was not found: " + imageUrl);
        }
        return targetLocation;
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("File is required and must not be empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !EXTENSION_BY_CONTENT_TYPE.containsKey(contentType.toLowerCase(Locale.ROOT))) {
            throw new InvalidFileException("Only JPEG, PNG and WEBP images are supported");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new InvalidFileException("File must have an original filename");
        }
    }

    private String resolveExtension(String originalFilename, String contentType) {
        int extensionSeparator = originalFilename.lastIndexOf('.');
        if (extensionSeparator >= 0 && extensionSeparator < originalFilename.length() - 1) {
            String extension = originalFilename.substring(extensionSeparator + 1).toLowerCase(Locale.ROOT);
            if (!ALLOWED_EXTENSIONS.contains(extension)) {
                throw new InvalidFileException("Unsupported image extension: " + extension);
            }
            return extension;
        }

        return EXTENSION_BY_CONTENT_TYPE.get(contentType);
    }

    public record StoredFile(
            String filename,
            Path path,
            String url,
            String contentType,
            long size
    ) {
    }
}
