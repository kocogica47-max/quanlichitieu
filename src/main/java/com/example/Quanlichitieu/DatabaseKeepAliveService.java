package com.example.Quanlichitieu;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

@Service
public class DatabaseKeepAliveService {

    @Autowired
    private DataSource dataSource;

    // Cấu hình chạy định kỳ: Cứ mỗi 6 tiếng (21600000 milliseconds) sẽ tự động ping database 1 lần
    @Scheduled(fixedRate = 21600000)
    public void pingAivenDatabase() {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            
            // Chạy một câu lệnh SQL cơ bản nhất để tạo tương tác giữ cho MySQL hoạt động
            statement.execute("SELECT 1");
            System.out.println("[Aiven Ping] Tu dong tuong tac giu ket noi database Aiven thanh cong!");
            
        } catch (Exception e) {
            System.err.println("[Aiven Ping] Loi giu ket noi Database: " + e.getMessage());
        }
    }
}