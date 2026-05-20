# Bước 1: Sử dụng Maven để build dự án
FROM maven:3.8.5-openjdk-17 AS build
COPY . .
RUN mvn clean package -Dmaven.test.skip=true

# Bước 2: Chạy file jar bằng Temurin Java 17
FROM amazoncorretto:17-alpine
COPY --from=build /target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]