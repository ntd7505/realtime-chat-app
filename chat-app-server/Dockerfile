# syntax=docker/dockerfile:1

# ==================================================
# STAGE 1: BUILD
# Dùng JDK 21 để compile và đóng gói ứng dụng
# ==================================================
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /workspace

# Copy Maven Wrapper và pom.xml trước để cache các layer ổn định
COPY .mvn .mvn
COPY mvnw pom.xml ./

# Cho phép chạy Maven Wrapper
RUN chmod +x mvnw

# Copy source code
COPY src src

# Build Spring Boot JAR. BuildKit cache giữ Maven dependencies giữa các lần build,
# kể cả khi source thay đổi hoặc một lần tải dependency bị gián đoạn.
# Test được chạy riêng trước docker build để image build nhanh và ổn định hơn.
RUN --mount=type=cache,target=/root/.m2,sharing=locked \
    ./mvnw -B -ntp clean package -DskipTests


# ==================================================
# STAGE 2: RUNTIME
# Image cuối chỉ chứa JRE và file JAR
# ==================================================
FROM eclipse-temurin:21-jre-alpine AS runtime

# Metadata của image
LABEL org.opencontainers.image.title="Chat App API"
LABEL org.opencontainers.image.description="Spring Boot backend for Chat App"

# Tạo user không có quyền root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy file JAR từ build stage sang runtime stage
COPY --from=builder --chown=appuser:appgroup \
    /workspace/target/chat-app-server-*.jar \
    /app/app.jar

# Chạy ứng dụng bằng non-root user
USER appuser

# Spring Boot mặc định chạy cổng 8080
EXPOSE 8080

# Lệnh chạy khi container khởi động
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
