package com.appreparto.auth;

import com.appreparto.common.dto.ApiResponse;
import com.appreparto.usuarios.Usuario;
import com.appreparto.usuarios.UsuarioService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UsuarioService usuarioService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        Usuario usuario = (Usuario) auth.getPrincipal();
        String token = jwtTokenProvider.generarToken(usuario.getEmail(), usuario.getRol().name());
        return ResponseEntity.ok(ApiResponse.ok(new LoginResponse(token, usuario.getRol().name(), usuario.getNombre())));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        usuarioService.crear(request.getNombre(), request.getEmail(),
                request.getPassword(), Usuario.Rol.valueOf(request.getRol()));
        return ResponseEntity.ok(ApiResponse.ok("Usuario creado exitosamente", null));
    }

    @Data
    public static class LoginRequest {
        @NotBlank @Email
        private String email;
        @NotBlank
        private String password;
    }

    @Data
    public static class RegisterRequest {
        @NotBlank @Size(min = 2, max = 100)
        private String nombre;
        @NotBlank @Email
        private String email;
        @NotBlank @Size(min = 6)
        private String password;
        @NotBlank
        private String rol;
    }

    public record LoginResponse(String token, String rol, String nombre) {}
}
