import Login from "../pages/Login.jsx";

const ProtectedNotice = ({ onLoggedIn }) => <Login onLoggedIn={onLoggedIn} />;

export default ProtectedNotice;
