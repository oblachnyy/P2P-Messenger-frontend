import React from "react";
import { NavLink } from "react-router-dom";
import { Box, defaultTheme } from "luxor-component-library";

class NavBar extends React.Component {
    render() {
        return (
            <div
                style={{
                    padding: "20px",
                    backgroundColor: defaultTheme.palette.primary.light,
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",  // Изменили justifyContent
                    alignItems: "center", // Центрирование по вертикали
                }}
            >
                <Box paddingX="small">
                    <NavLink
                        style={{
                            textDecoration: "none",
                            color: defaultTheme.palette.common.white,
                            marginRight: "30px", // Переместили вправо
                        }}
                        to="/home"
                    >
                        Домашняя страница
                    </NavLink>
                    <NavLink
                        style={{
                            textDecoration: "none",
                            color: defaultTheme.palette.common.white,
                            marginRight: "30px",
                        }}
                        to="/favorites"
                    >
                        Закладки
                    </NavLink>
                    <NavLink
                        style={{
                            textDecoration: "none",
                            color: defaultTheme.palette.common.white,
                            marginRight: "30px",
                        }}
                        to="/profile"
                    >
                        Профиль
                    </NavLink>
                </Box>

                {/* Кнопка Logout в правом верхнем углу */}
                <Box>
                    <NavLink
                        style={{
                            textDecoration: "none",
                            color: defaultTheme.palette.common.white,
                        }}
                        to="/logout"
                    >
                        Выйти из системы
                    </NavLink>
                </Box>
            </div>
        );
    }
}

export default NavBar;