
import React, { useEffect, useState } from "react";
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    useNavigate,
    useParams
} from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const API = "http://localhost:9000";

// LOGIN
function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const login = async (e) => {
        e.preventDefault();

        try {
            const res = await axios.get(
                `${API}/accounts?email=${email}&password=${password}`
            );

            if (res.data.length === 0) {
                setError("Sai email hoặc mật khẩu!");
            } else if (res.data[0].status.toLowerCase() !== "active") {
                setError("Tài khoản bị khóa!");
            } else {
                localStorage.setItem("user", JSON.stringify(res.data[0]));
                navigate("/subjects");
            }
        } catch {
            setError("Không kết nối được database!");
        }
    };

    return (
        <div className="container mt-5" style={{ maxWidth: "400px" }}>
            <h2 className="text-center">Login</h2>

            <form onSubmit={login}>
                <input
                    className="form-control mb-3"
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    className="form-control mb-3"
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <p className="text-danger">{error}</p>
                <button className="btn btn-primary w-100">Login</button>
            </form>
        </div>
    );
}

// SUBJECTS
function Subjects() {
    const [subjects, setSubjects] = useState([]);
    const [questions, setQuestions] = useState([]);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));

    useEffect(() => {
        axios.get(`${API}/subjects`).then(res => setSubjects(res.data));
        axios.get(`${API}/questions`).then(res => setQuestions(res.data));
    }, []);

    const logout = () => {
        localStorage.removeItem("user");
        navigate("/login");
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between">
                <p>Welcome {user.email}</p>
                <button className="btn btn-danger btn-sm" onClick={logout}>
                    Logout
                </button>
            </div>

            <h3>Danh sách môn học</h3>

            <table className="table table-bordered">
                <thead className="table-dark">
                    <tr>
                        <th>Mã môn</th>
                        <th>Tên môn</th>
                        <th>Số câu hỏi</th>
                        <th></th>
                    </tr>
                </thead>

                <tbody>
                    {subjects.map(subject => (
                        <tr key={subject.id}>
                            <td>{subject.id}</td>
                            <td>{subject.name}</td>
                            <td>
                                {questions.filter(
                                    q => q.subjectId === subject.id
                                ).length}
                            </td>
                            <td>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() =>
                                        navigate(`/questions/${subject.id}`)
                                    }
                                >
                                    Xem câu hỏi
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// QUESTIONS
function QuestionPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [subject, setSubject] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [content, setContent] = useState("");
    const [options, setOptions] = useState(["", "", "", ""]);
    const [answer, setAnswer] = useState("");

    const loadData = async () => {
        const s = await axios.get(`${API}/subjects/${id}`);
        const q = await axios.get(`${API}/questions?subjectId=${id}`);

        setSubject(s.data);
        setQuestions(q.data);
    };

    useEffect(() => {
        loadData();
    }, [id]);

    const openAdd = () => {
        setEditId(null);
        setContent("");
        setOptions(["", "", "", ""]);
        setAnswer("");
        setShowForm(true);
    };

    const openEdit = (q) => {
        let opts = [...q.options];

        if (opts.length === 1 && opts[0].includes(";")) {
            opts = opts[0].split(";").map(x => x.trim());
        }

        while (opts.length < 4) opts.push("");

        setEditId(q.id);
        setContent(q.content);
        setOptions(opts.slice(0, 4));
        setAnswer(q.correctAnswer);
        setShowForm(true);
    };

    const saveQuestion = async (e) => {
        e.preventDefault();

        const data = {
            subjectId: id,
            content,
            options,
            correctAnswer: answer
        };

        if (editId) {
            await axios.put(`${API}/questions/${editId}`, {
                id: editId,
                ...data
            });
        } else {
            await axios.post(`${API}/questions`, data);
        }

        setShowForm(false);
        loadData();
    };

    const deleteQuestion = async (questionId) => {
        if (window.confirm("Bạn có chắc muốn xóa?")) {
            await axios.delete(`${API}/questions/${questionId}`);
            loadData();
        }
    };

    if (!subject) return <p className="container mt-4">Loading...</p>;

    return (
        <div className="container mt-4">
            <h3>{subject.name} ({subject.id})</h3>
            <p>Tổng số câu hỏi: {questions.length}</p>

            <button className="btn btn-success me-2" onClick={openAdd}>
                Thêm câu hỏi
            </button>

            <button className="btn btn-secondary" onClick={() => navigate("/subjects")}>
                Quay lại
            </button>

            {showForm && (
                <form className="card p-3 my-3" onSubmit={saveQuestion}>
                    <h5>{editId ? "Sửa câu hỏi" : "Thêm câu hỏi"}</h5>

                    <textarea
                        className="form-control mb-3"
                        placeholder="Nội dung câu hỏi"
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        required
                    />

                    {options.map((option, index) => (
                        <input
                            key={index}
                            className="form-control mb-2"
                            placeholder={`Đáp án ${index + 1}`}
                            value={option}
                            onChange={e => {
                                const newOptions = [...options];
                                newOptions[index] = e.target.value;
                                setOptions(newOptions);
                            }}
                            required
                        />
                    ))}

                    <select
                        className="form-select mb-3"
                        value={answer}
                        onChange={e => setAnswer(e.target.value)}
                        required
                    >
                        <option value="">Chọn đáp án đúng</option>
                        {options.map((option, index) => (
                            <option key={index} value={option} disabled={!option.trim()}>
                                {option}
                            </option>
                        ))}
                    </select>

                    <button className="btn btn-primary me-2">Lưu</button>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowForm(false)}
                    >
                        Hủy
                    </button>
                </form>
            )}

            <table className="table table-bordered mt-3">
                <thead className="table-dark">
                    <tr>
                        <th>#</th>
                        <th>Câu hỏi</th>
                        <th>Đáp án</th>
                        <th>Đáp án đúng</th>
                        <th></th>
                    </tr>
                </thead>

                <tbody>
                    {questions.map((q, index) => (
                        <tr key={q.id}>
                            <td>{index + 1}</td>
                            <td>{q.content}</td>
                            <td>{q.options.join(", ")}</td>
                            <td>{q.correctAnswer}</td>
                            <td>
                                <button
                                    className="btn btn-warning btn-sm me-2"
                                    onClick={() => openEdit(q)}
                                >
                                    Sửa
                                </button>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => deleteQuestion(q.id)}
                                >
                                    Xóa
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// PROTECTED ROUTE
function Protected({ children }) {
    return localStorage.getItem("user")
        ? children
        : <Navigate to="/login" />;
}

// APP
export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                    path="/subjects"
                    element={<Protected><Subjects /></Protected>}
                />
                <Route
                    path="/questions/:id"
                    element={<Protected><QuestionPage /></Protected>}
                />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </BrowserRouter>
    );
}
