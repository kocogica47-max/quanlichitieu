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

import java.util.List;

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
}