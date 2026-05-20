package com.example.Quanlichitieu.Repository;

import com.example.Quanlichitieu.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Hàm tìm kiếm người dùng bằng tên tài khoản khi đăng nhập
    User findByUsername(String username);
    
}
    
