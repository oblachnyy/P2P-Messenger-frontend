import React from "react";
import {Box, Button, defaultTheme, fontSizes, Row, Stack,} from "luxor-component-library";
import {get_user_from_token, upload_profile_pic} from "../../api/auth";
import axios from "axios";
import {Redirect} from "react-router-dom";

class Profile extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            user: null,
            new_email: "",
            new_username: "",
            new_password: "",
            last_name: "",
            first_name: "",
            surname: "",
            isLoaded: false,
            isEditMode: false,
            shouldRedirect: false,
            errorMessage: "",
            isAvatarEditMode: false,
        };
        this.onUsernameChange = this.onUsernameChange.bind(this);
        this.onEmailChange = this.onEmailChange.bind(this);
        this.onPasswordChange = this.onPasswordChange.bind(this);
        this.onEnterHandler = this.onEnterHandler.bind(this);
        this.imageUpload = this.imageUpload.bind(this);
        this.userDateUpload = this.userDateUpload.bind(this);
        this.toggleEditMode = this.toggleEditMode.bind(this);
        this.toggleAvatarEditMode = this.toggleAvatarEditMode.bind(this);
        this.onLastNameChange = this.onLastNameChange.bind(this);
        this.onFirstNameChange = this.onFirstNameChange.bind(this);
        this.onSurnameChange = this.onSurnameChange.bind(this);
    }

    onLastNameChange(e) {
        e.preventDefault();
        const last_name = e.target.value;
        this.setState({ last_name });
    }

    onFirstNameChange(e) {
        e.preventDefault();
        const first_name = e.target.value;
        this.setState({ first_name });
    }

    onSurnameChange(e) {
        e.preventDefault();
        const surname = e.target.value;
        this.setState({ surname });
    }

    onUsernameChange(e) {
        e.preventDefault();
        const new_username = e.target.value;

        // Обнуляем ошибку при изменении значения логина
        this.setState({
            new_username,
            errorMessage: "",
        });

        const pattern = /^(?=.*[A-Za-zА-Яа-я])(?=.*[0-9]).{4,20}$/;

        if (
            new_username.length >= 4 &&
            new_username.length <= 20 &&
            pattern.test(new_username)
        ) {
            this.setState({ new_username });
        }
    }

    onEmailChange(e) {
        e.preventDefault();
        const new_email = e.target.value;

        // Обнуляем ошибку при изменении значения почты
        this.setState({
            new_email,
            errorMessage: "",
        });

        const pattern = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;

        if (
            pattern.test(new_email)
        ) {
            this.setState({ new_email });
        }
    }

    toggleEditMode() {
        this.setState((prevState) => ({
            isEditMode: !prevState.isEditMode,
        }));
    }

    toggleAvatarEditMode() {
        this.setState((prevState) => ({
            isAvatarEditMode: !prevState.isAvatarEditMode,
        }));
    }

    onPasswordChange(e) {
        e.preventDefault();
        const new_password = e.target.value;

        // Обнуляем ошибку при изменении значения пароля
        this.setState({
            new_password,
            errorMessage: "",
        });

        const pattern = /^[a-zA-Z0-9!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]+$/;

        if (
            new_password.length >= 6 &&
            new_password.length <= 40 &&
            pattern.test(new_password)
        ) {
            this.setState({ new_password });
        }
    }

    onEnterHandler(e) {
        e.preventDefault();
    }

    userDateUpload(e) {
        e.preventDefault();

        if (
            !this.state.new_email ||
            !this.state.new_username ||
            !this.state.new_password ||
            !this.state.last_name ||
            !this.state.first_name
        ) {
            const errorMessage = "Все поля должны быть заполнены";
            this.setState({ errorMessage });
            return;
        }

        // В этом месте добавлены условия для проверки валидности ФИО перед сохранением изменений
        const namePattern = /^[a-zA-ZА-Яа-я]+$/;

        if (
            !namePattern.test(this.state.last_name) ||
            !namePattern.test(this.state.first_name)
        ) {
            const errorMessage = "Фамилия, имя и отчество могут содержать только буквы";
            this.setState({ errorMessage });
            return;
        }

        // Проверка валидности отчества, если оно заполнено
        if (this.state.surname && !namePattern.test(this.state.surname)) {
            const errorMessage = "Фамилия, имя и отчество могут содержать только буквы";
            this.setState({ errorMessage });
            return;
        }


        let body = {
            email: this.state.new_email,
            username: this.state.new_username,
            password: this.state.new_password,
            last_name: this.state.last_name,
            first_name: this.state.first_name,
            surname: this.state.surname,
        };

        let token = localStorage.getItem("token");

        const instance = axios.create({
            timeout: 1000,
            headers: {
                "Access-Control-Allow-Origin": "*",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        instance
            .patch("http://localhost:8000/api/user/me", body)
            .then((response) => {
                this.setState({
                    isChangesSaved: true,
                    message: "Изменения сохранены",
                    shouldRedirect: true,
                });
            })
            .catch((err) => {
                console.error("ERROR Updating User Data");
                console.error(err);
                const errorMessage = "Произошла ошибка при сохранении изменений";
                this.setState({ errorMessage });
            });
    }

    imageUpload(e) {
        e.preventDefault();
        console.log("Image Upload");
        const files = e.target.files;
        console.log(files[0]);
        const formData = new FormData();
        formData.append("file", files[0], files[0].name);

        let token = localStorage.getItem("token");
        const instance = axios.create({
            timeout: 1000,
            headers: {
                //"Content-Type": "multipart/form-data",
                "Content-Type": files[0].type,
                "Access-Control-Allow-Origin": "*",
                accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        instance
            .post(upload_profile_pic, formData)
            .then((response) => {
                localStorage.setItem("profilePicURL", response.data.image_url);
                this.setState({user: response.data, isLoaded: true,shouldRedirect: true,});
            })
            .catch((err) => {
                console.error("ERROR Uploading Profile Picture");
                console.error(err);
            });
    }

    componentDidMount() {
        let token = localStorage.getItem("token");
        const cachedProfilePicURL = localStorage.getItem("profilePicURL");
        if (cachedProfilePicURL) {
            this.setState({user: {profile_pic_img_src: cachedProfilePicURL}, isLoaded: true});
        } else {
            const instance = axios.create({
                timeout: 1000,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Accept": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            instance
                .get(get_user_from_token)
                .then((response) => {
                    const link = response.data;
                    this.setState({user: {profile_pic_img_src: link}, isLoaded: true});
                    localStorage.setItem("profilePicURL", link);
                })
                .catch((error) => {
                    console.error("Ошибка получения URL фотографии пользователя", error);
                });
        }
    }

    render() {
        const {
            isLoaded,
            user,
            isEditMode,
            shouldRedirect,
            errorMessage,
        } = this.state;
        let avatar_image_url = localStorage.getItem("profilePicURL");

        if (shouldRedirect) {
            return <Redirect to="/home" />;
        }

        if (avatar_image_url === "null" || avatar_image_url === null) {
            localStorage.setItem(
                "profilePicURL",
                "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Anonymous.svg/1481px-Anonymous.svg.png"
            );
        }

        if (!isLoaded) {
            return <Box>Loading...</Box>;
        } else {
            return (
                <Box
                    margin="none"
                    padding="large"
                    height="100vh"
                    backgroundColor={defaultTheme.palette.grey[200]}
                >
                    <Row>
                        <Box display="flex" alignItems="center" justifyContent="center">
                            <Stack
                                space="medium"
                                textAlign="center"
                                left="32.5%"
                                position="relative"
                            >
                                <Box
                                    styles={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <img
                                        className="avatar"
                                        src={avatar_image_url}
                                        alt={"Photo of " + user.username}
                                        style={{
                                            width: 90,
                                            height: 90,
                                            margin: "0 auto",
                                            borderRadius: "50%", // Делает изображение круглым
                                        }}
                                    />
                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                    >
                                        <input
                                            type="file"
                                            id="fileUpload"
                                            accept="image/png, image/jpeg, image/jpg"
                                            onChange={this.imageUpload}
                                            disabled={!this.state.isAvatarEditMode}
                                        />
                                    </Box>
                                    <h1>Здравствуйте, {localStorage.getItem("username")}</h1>
                                    <h1>{localStorage.getItem("lastname") !== "null" ? localStorage.getItem("lastname") : ""} {localStorage.getItem("name") !== "null" ? localStorage.getItem("name") : ""} {localStorage.getItem("surname") !== "null" ? localStorage.getItem("surname") : ""} </h1>
                                </Box>
                                <Box>
                                    <input
                                        value={this.state.new_email}
                                        placeholder="Новый e-mail"
                                        onChange={this.onEmailChange}
                                        autoComplete="off"
                                        disabled={!isEditMode}
                                    />
                                </Box>
                                <Box>
                                    <input
                                        value={this.state.new_username}
                                        placeholder="Новый логин"
                                        onChange={this.onUsernameChange}
                                        autoComplete="off"
                                        disabled={!isEditMode}
                                    />
                                </Box>
                                <Box>
                                    <input
                                        value={this.state.new_password}
                                        onChange={this.onPasswordChange}
                                        onKeyUp={(e) => this.onEnterHandler(e)}
                                        type="password"
                                        placeholder="Новый пароль"
                                        autoComplete="off"
                                        disabled={!isEditMode}
                                    />
                                </Box>
                                <Box>
                                    <input
                                        value={this.state.last_name}
                                        placeholder="Фамилия"
                                        onChange={this.onLastNameChange}
                                        autoComplete="off"
                                        disabled={!this.state.isEditMode}
                                    />
                                </Box>
                                <Box>
                                    <input
                                        value={this.state.first_name}
                                        placeholder="Имя"
                                        onChange={this.onFirstNameChange}
                                        autoComplete="off"
                                        disabled={!this.state.isEditMode}
                                    />
                                </Box>
                                <Box>
                                    <input
                                        value={this.state.surname}
                                        placeholder="Отчество"
                                        onChange={this.onSurnameChange}
                                        autoComplete="off"
                                        disabled={!this.state.isEditMode}
                                    />
                                </Box>
                                <Button
                                    size="small"
                                    onClick={this.userDateUpload}
                                    text="Сохранить изменения"
                                    disabled={!isEditMode}
                                />
                                <Button
                                    size="small"
                                    onClick={this.toggleAvatarEditMode}
                                    text={"Изменить аватарку"}
                                />
                                <Button
                                    size="small"
                                    onClick={this.toggleEditMode}
                                    text={isEditMode ? "Отменить" : "Изменить данные"}
                                    style={{ width: "150px", height: "35px" }}
                                />
                                <Box color="red" padding="small">
                                    {errorMessage !== "" && <p>{errorMessage}</p>}
                                </Box>
                            </Stack>
                        </Box>
                    </Row>
                </Box>
            );
        }
    }
}

export default Profile;