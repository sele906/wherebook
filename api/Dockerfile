
# 1. Gradle 빌드
FROM eclipse-temurin:17-jdk AS build

WORKDIR /app

COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

RUN chmod +x gradlew

COPY src src

RUN ./gradlew clean bootJar \
    -x test \
    -x generateGitProperties \
    --no-daemon \
    --console=plain

# 2. Spring Boot 실행
FROM eclipse-temurin:17-jre

WORKDIR /app

COPY build/libs/api-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]