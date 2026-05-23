package com.example.Quanlichitieu.Controller;

import com.example.Quanlichitieu.Model.Expense;
import com.example.Quanlichitieu.Model.User;
import com.example.Quanlichitieu.Repository.ExpenseRepository;
import com.example.Quanlichitieu.Repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
public class ControllerExpense {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private UserRepository userRepository;

    // --- CHỨC NĂNG ĐĂNG KÝ ---
    @GetMapping("/register")
    public String showRegisterForm() {
        return "register";
    }

    @PostMapping("/register")
    public String registerUser(@RequestParam String username, @RequestParam String password) {
        if (userRepository.findByUsername(username) != null) {
            return "redirect:/register?error=true";
        }
        User user = new User();
        user.setUsername(username);
        user.setPassword(password);
        userRepository.save(user);
        return "redirect:/login";
    }

    // --- CHỨC NĂNG ĐĂNG NHẬP ---
    @GetMapping("/login")
    public String showLoginForm() {
        return "login";
    }

    @PostMapping("/login")
    public String loginUser(@RequestParam String username, @RequestParam String password, HttpSession session, Model model) {
        User user = userRepository.findByUsername(username);
        if (user != null && user.getPassword().equals(password)) {
            session.setAttribute("loggedInUser", user);
            return "redirect:/";
        }
        model.addAttribute("error", "Sai tài khoản hoặc mật khẩu!");
        return "login";
    }

    // --- CHỨC NĂNG ĐĂNG XUẤT ---
    @GetMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/login";
    }

    // --- TRANG CHỦ ---
    @GetMapping("/")
    public String viewHomepage(Model model, HttpSession session) {
        User loggedInUser = (User) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            return "redirect:/login";
        }

        List<Expense> listExpenses = expenseRepository.findByUserId(loggedInUser.getId());
        model.addAttribute("listExpenses", listExpenses);
        model.addAttribute("username", loggedInUser.getUsername());
        
        double totalAmount = 0;
        if (listExpenses != null && !listExpenses.isEmpty()) {
            totalAmount = listExpenses.stream().mapToDouble(Expense::getAmount).sum();
        }
        model.addAttribute("totalAmount", totalAmount);
        
        return "index";
    }

    @GetMapping("/showNewExpenseForm")
    public String showNewExpenseFrom(Model model, HttpSession session) {
        if (session.getAttribute("loggedInUser") == null) return "redirect:/login";
        Expense expense = new Expense();
        model.addAttribute("expense", expense);
        return "new_expense";
    }

    @PostMapping("/saveExpense")
    public String saveExpense(@ModelAttribute("expense") Expense expense, HttpSession session) {
        User loggedInUser = (User) session.getAttribute("loggedInUser");
        if (loggedInUser == null) return "redirect:/login";
        
        expense.setUser(loggedInUser);
        expenseRepository.save(expense);
        return "redirect:/";
    }

    @GetMapping("/deleteExpense/{id}")
    public String deleteExpense(@PathVariable(value = "id") long id, HttpSession session) {
        if (session.getAttribute("loggedInUser") == null) return "redirect:/login";
        this.expenseRepository.deleteById(id);
        return "redirect:/";
    }

    // --- API THỐNG KÊ SO SÁNH THÁNG (ĐÃ SỬA LỖI VÀ TỐI ƯU HÓA) ---
    @GetMapping("/api/thong-ke/so-sanh-thang")
    @ResponseBody
    public Map<String, Object> getSoSanhThang(HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        User loggedInUser = (User) session.getAttribute("loggedInUser"); // Đã sửa lỗi dấu gạch chéo \" ở đây
        
        // Nếu chưa đăng nhập, trả về lỗi 401 giả lập dạng JSON
        if (loggedInUser == null) {
            response.put("error", "Unauthorized");
            return response;
        }

        // Lấy toàn bộ danh sách chi tiêu của người dùng này từ Database
        List<Expense> listExpenses = expenseRepository.findByUserId(loggedInUser.getId());
        
        LocalDate today = LocalDate.now();
        int currentMonth = today.getMonthValue();
        int currentYear = today.getYear();
        
        LocalDate lastMonthDate = today.minusMonths(1);
        int lastMonth = lastMonthDate.getMonthValue();
        int lastMonthYear = lastMonthDate.getYear();

        double tongThangNay = 0;
        double tongThangTruoc = 0;

        if (listExpenses != null) {
            for (Expense exp : listExpenses) {
                if (exp.getDate() != null) {
                    LocalDate expDate;
                    
                    // Cơ chế tự động nhận diện kiểu dữ liệu an toàn:
                    if (exp.getDate() instanceof LocalDate) {
                        expDate = (LocalDate) (Object) exp.getDate();
                    } else {
                        // Nếu trường date lưu kiểu String (Ví dụ: "2026-05-23"), tự động phân tích về đối tượng Ngày
                        expDate = LocalDate.parse(exp.getDate().toString());
                    }
                    
                    // Tính tổng tiền tháng này
                    if (expDate.getMonthValue() == currentMonth && expDate.getYear() == currentYear) {
                        tongThangNay += exp.getAmount();
                    } 
                    // Tính tổng tiền tháng trước
                    else if (expDate.getMonthValue() == lastMonth && expDate.getYear() == lastMonthYear) {
                        tongThangTruoc += exp.getAmount();
                    }
                }
            }
        }

        // Tính % chênh lệch tăng/giảm giữa 2 tháng
        double phanTramThayDoi = 0;
        if (tongThangTruoc > 0) {
            phanTramThayDoi = ((tongThangNay - tongThangTruoc) / tongThangTruoc) * 100;
        }

        // Đóng gói dữ liệu chuẩn JSON để JavaScript ở index.html nhận được
        response.put("labelThangNay", "Tháng " + currentMonth);
        response.put("tongThangNay", tongThangNay);
        response.put("labelThangTruoc", "Tháng " + lastMonth);
        response.put("tongThangTruoc", tongThangTruoc);
        response.put("phanTramThayDoi", Math.round(phanTramThayDoi * 100.0) / 100.0);

        return response;
    }
}