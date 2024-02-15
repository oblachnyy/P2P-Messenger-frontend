import React from "react";
import axios from 'axios';
import { Redirect } from "react-router-dom";
import { Box, Button, defaultTheme, fontSizes, Row, Stack } from "luxor-component-library";
import { login, registration } from "../../api/auth";

class Registration extends React.Component {
    constructor() {
        super();
        this.state = {
            isRegisteredIn: false,
            isLoggedIn: false,
            email: "",
            username: "",
            password: "",
            error_message: "",
            isEmailValid: false,
            isUsernameValid: false,
            isPasswordValid: false,
        };
        this.registerHandler = this.registerHandler.bind(this);
        this.clearFields = this.clearFields.bind(this);
    }

    clearFields = () => {
        this.setState({
            email: "",
            username: "",
            password: "",
            error_message: "",
            isEmailValid: false,
            isUsernameValid: false,
            isPasswordValid: false,
        });
    };

    emailChange(e) {
        const email = e.target.value;
        const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
        const isEmailValid = emailRegex.test(email);

        this.setState({
            email,
            isEmailValid,
            error_message: isEmailValid ? "" : "Некорректный формат email"
        });
    }

    usernameChange(e) {
        const username = e.target.value;
        const usernamePattern = /^(?=.*[A-Za-zА-Яа-я])(?=.*[0-9]).{4,20}$/;
        const isUsernameValid = usernamePattern.test(username);

        this.setState({
            username,
            isUsernameValid,
            error_message: isUsernameValid ? "" : "Имя пользователя должно содержать от 4 до 20 символов и должно включать буквы и цифры."
        });
    }

    passwordChange(e) {
        const password = e.target.value;
        const passwordPattern = /^[a-zA-Z0-9!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]{6,40}$/;
        const isPasswordValid = passwordPattern.test(password);

        this.setState({
            password,
            isPasswordValid,
            error_message: isPasswordValid ? "" : "Пароль должен содержать от 6 до 40 символов и может включать буквы, цифры и спец символы."
        });
    }

    registerHandler() {
        const { isEmailValid, isUsernameValid, isPasswordValid } = this.state;

        if (isEmailValid && isUsernameValid && isPasswordValid) {
        // Все поля валидны, выполняем запрос на регистрацию
        axios.post(registration, {
            email: this.state.email,
            password: this.state.password,
            is_active: true,
            is_superuser: false,
            is_verified: false,
            username: this.state.username
        }, {
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then((response) => {
                console.log(response.data);
                if (response.status === 201) {
                    this.setState({ isRegisteredIn: true });
                    this.loginHandler();
                } else {
                    this.setState({ error_message: "Please try again." });
                }
            })
            .catch((error) => {
                // Обработка ошибок
                if (error.response && error.response.status === 400) {
                    console.log(error.response.data);
                    if (error.response.data.detail === "REGISTER_USER_ALREADY_EXISTS") {
                        this.setState({ error_message: "Пользователь с таким email существует." });
                    }
                } else {
                    console.log(error);
                    this.setState({ error_message: "Ошибка во время регистрации." });
                }
            });
        } else {
            // Не все поля валидны, выполните необходимые действия
            this.setState({ error_message: "Пожалуйста, введите корректные данные во все поля." });
        }
    }

    loginHandler() {
        const loginParams = new URLSearchParams();
        loginParams.append("username", this.state.username);
        loginParams.append("password", this.state.password);
        let loginConfig = {
            headers: {
                "content-type": "application/x-www-form-urlencoded;charset=utf-8",
                accept: "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        };
        axios.post(login, loginParams, loginConfig)
            .then((loginResponse) => {
                console.log(loginResponse.data.access_token);
                if (loginResponse.data.access_token !== undefined) {
                    localStorage.setItem("token", loginResponse.data.access_token);
                    localStorage.setItem("email", this.state.username);
                    this.setState({ isLoggedIn: true });
                }
            })
            .catch((loginErr) => {
                console.log("ERROR LOGIN: \n" + loginErr);
                this.setState({
                    error_message: "Error with logging in after registration",
                });
            });
    }

    render() {
        const input_text_style = {
            padding: "10px",
            paddingLeft: "25px",
            paddingRight: "25px",
            width: "400px",
            borderRadius: "3em",
            outline: "none",
            border: `2px solid ${defaultTheme.palette.primary.main}`,
            fontWeight: 400,
            fontSize: fontSizes.medium,
            fontFamily: defaultTheme.typography.primaryFontFamily,
            color: defaultTheme.palette.grey[400],
        };
        const { isRegisteredIn, isLoggedIn, error_message } = this.state;
        if (isRegisteredIn === true && isLoggedIn === true) {
            return <Redirect push to="/home" />;
        } else {
            return (<Box
                padding="large"
                height="720px"
                backgroundColor={defaultTheme.palette.grey[100]}
                textAlign="center"
                style={{
                    height: "100vh",
                }}
            >
                <Stack>
                    <Box
                        style={{ fontSize: "2rem" }}
                        color={defaultTheme.palette.secondary.light}
                        paddingBottom="large"
                    >
            <span>
              <h1 style={{ color: defaultTheme.palette.secondary.light }}>
                PolyTex
              </h1>
              <h1 style={{ color: defaultTheme.palette.primary.main }}>
                Chat
              </h1>
            </span>
                    </Box>
                    <Stack space="medium" padding="medium">
                        <Box>
                            <input
                                style={input_text_style}
                                value={this.state.email}
                                onChange={(e) => this.setState({ email: e.target.value })}
                                autoComplete="off"
                                placeholder="Введите email"
                                name="email"
                                required
                            />
                        </Box>
                        <Box>
                            <input
                                style={input_text_style}
                                value={this.state.username}
                                onChange={(e) => this.setState({ username: e.target.value })}
                                autoComplete="off"
                                placeholder="Введите имя пользователя"
                                name="uname"
                                required
                            />
                        </Box>
                        <Box>
                            <input
                                style={input_text_style}
                                value={this.state.password}
                                onChange={(e) => this.setState({ password: e.target.value })}
                                autoComplete="off"
                                placeholder="Введите пароль"
                                name="psw"
                                type="password"
                                required
                            />
                        </Box>
                    </Stack>
                    <Row>
                        <Box>
                            <Button
                                variant="outline"
                                color="primary"
                                size="medium"
                                text="Зарегистрироваться"
                                onClick={this.registerHandler}
                                disabled={!this.state.isEmailValid || !this.state.isUsernameValid || !this.state.isPasswordValid || this.state.email === "" || this.state.username === "" || this.state.password === ""}
                            />
                            <Button
                                variant="outline"
                                color="primary"
                                size="medium"
                                text="Очистить"
                                onClick={this.clearFields}
                            />
                        </Box>
                    </Row>
                    <Box color="red" padding="small">
                        {error_message !== "" && <p>{error_message}</p>}
                    </Box>
                </Stack>
            </Box>);
        }
    }
}

export default Registration;
