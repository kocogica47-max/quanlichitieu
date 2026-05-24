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
    public String loginUser(@RequestParam String username, @RequestParam String password, HttpSession session) {
        User user = userRepository.findByUsername(username);
        if (user != null && user.getPassword().equals(password)) {
            session.setAttribute("loggedInUser", user);
            return "redirect:/";
        }
        return "redirect:/login?error=true";
    }

    // --- CHỨC NĂNG ĐĂNG XUẤT ---
    @GetMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/login";
    }

    // --- TRANG CHỦ HỆ THỐNG ---
    @GetMapping("/")
    public String viewHomePage(Model model, HttpSession session) {
        User loggedInUser = (User) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            return "redirect:/login";
        }

        Long userId = loggedInUser.getId();
        List<Expense> listExpenses = expenseRepository.findByUserId(userId);
        
        double totalAmount = 0;
        if (listExpenses != null) {
            for (Expense exp : listExpenses) {
                if (exp.getAmount() != null) {
                    totalAmount += exp.getAmount();
                }
            }
        }

        model.addAttribute("username", loggedInUser.getUsername());
        model.addAttribute("listExpenses", listExpenses);
        model.addAttribute("totalAmount", totalAmount);
        return "index";
    }

    // --- THÊM KHOẢN CHI MỚI ---
    @GetMapping("/showNewExpenseForm")
    public String showNewExpenseForm(Model model, HttpSession session) {
        User loggedInUser = (User) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            return "redirect:/login";
        }
        Expense expense = new Expense();
        model.addAttribute("expense", expense);
        return "new_expense";
    }

    @PostMapping("/saveExpense")
    public String saveExpense(@ModelAttribute("expense") Expense expense, HttpSession session) {
        User loggedInUser = (User) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            return "redirect:/login";
        }
        expense.setUser(loggedInUser);
        expenseRepository.save(expense);
        return "redirect:/";
    }

    // --- XÓA KHOẢN CHI ---
    @GetMapping("/deleteExpense/{id}")
    public String deleteExpense(@PathVariable(value = "id") long id, HttpSession session) {
        User loggedInUser = (User) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            return "redirect:/login";
        }
        
        Expense expense = expenseRepository.findById(id).orElse(null);
        
        if (expense != null && expense.getUser() != null) {
            String expenseUserId = String.valueOf(expense.getUser().getId());
            String currentUserId = String.valueOf(loggedInUser.getId());
            
            if (expenseUserId.equals(currentUserId)) {
                expenseRepository.deleteById(id);
            }
        }
        return "redirect:/";
    }

    // --- API JSON THỐNG KÊ BIỂU ĐỒ ---
    @GetMapping("/api/xu-huong-chi-tieu")
    @ResponseBody
    public Map<String, Object> getXuHuongChiTieu(HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        User loggedInUser = (User) session.getAttribute("loggedInUser");

        double tongThangNay = 0;
        double tongThangTruoc = 0;

        LocalDate today = LocalDate.now();
        int currentMonth = today.getMonthValue();
        int currentYear = today.getYear();

        LocalDate lastMonthDate = today.minusMonths(1);
        int lastMonth = lastMonthDate.getMonthValue();
        int lastMonthYear = lastMonthDate.getYear();

        if (loggedInUser != null) {
            Long userId = loggedInUser.getId();
            List<Expense> listExpenses = expenseRepository.findByUserId(userId);
            
            if (listExpenses != null) {
                for (Expense exp : listExpenses) {
                    // Do exp.getDate() hiện tại đã là kiểu LocalDate chuẩn nên không cần ép kiểu phức tạp
                    if (exp.getAmount() == null || exp.getDate() == null) continue;

                    LocalDate expDate = exp.getDate();

                    if (expDate.getMonthValue() == currentMonth && expDate.getYear() == currentYear) {
                        tongThangNay += exp.getAmount();
                    } else if (expDate.getMonthValue() == lastMonth && expDate.getYear() == lastMonthYear) {
                        tongThangTruoc += exp.getAmount();
                    }
                }
            }
        } else {
            response.put("labelThangNay", "Tháng " + currentMonth);
            response.put("tongThangNay", 0.0);
            response.put("labelThangTruoc", "Tháng " + lastMonth);
            response.put("tongThangTruoc", 0.0);
            response.put("phanTramThayDoi", 0.0);
            return response;
        }

        double phanTramThayDoi = 0;
        if (tongThangTruoc > 0) {
            phanTramThayDoi = ((tongThangNay - tongThangTruoc) / tongThangTruoc) * 100;
        } else if (tongThangTruoc == 0 && tongThangNay > 0) {
            phanTramThayDoi = 100;
        }

        response.put("labelThangNay", "Tháng " + currentMonth);
        response.put("tongThangNay", tongThangNay);
        response.put("labelThangTruoc", "Tháng " + lastMonth);
        response.put("tongThangTruoc", tongThangTruoc);
        response.put("phanTramThayDoi", Math.round(phanTramThayDoi * 10.0) / 10.0);

        return response;
    }
}