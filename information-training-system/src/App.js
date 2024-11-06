import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import TrainingData from './TrainingData';
import EmployeeAddForm from './EmployeeAddForm';
import EmployeeListView from './EmployeeListView';
import EmployeeLogin from './EmployeeLogin';
import EmployeeProfile from './EmployeeProfile';
import EmployeeDetailPage from './EmployeeDetailPage';
import ViewEmployeeProfile from './ViewEmployeeProfile';
import pdrrmoLogo from './asset/PDRRMOLOGONEW2.png';
import AllTrainingList from './AllTrainingList';

function App() {
    const [isAdminAuthenticated, setAdminAuthenticated] = useState(false);
    const [isUserAuthenticated, setUserAuthenticated] = useState(false);
    const [employeeProfile, setEmployeeProfile] = useState(null);
    const [reloadEmployees, setReloadEmployees] = useState(false);
    const navigate = useNavigate();
    const location = useLocation(); // To get the current route

    useEffect(() => {
        const fetchEmployeeData = async () => {
            try {
                const response = await fetch('https://learning-development-monitoring-system.vercel.app/employees');
                const data = await response.json();
                setReloadEmployees(false);

                if ((isAdminAuthenticated || isUserAuthenticated) && employeeProfile) {
                    const loggedInProfile = data.find(
                        (employee) => employee.username === employeeProfile.username
                    );
                    setEmployeeProfile(loggedInProfile);
                }
            } catch (error) {
                console.error('Error fetching employee data:', error);
            }
        };

        if (isAdminAuthenticated || isUserAuthenticated || reloadEmployees) {
            fetchEmployeeData();
        }
    }, [isAdminAuthenticated, isUserAuthenticated, reloadEmployees, employeeProfile]);

    const handleAdminLogin = async (credentials) => {
        try {
            const response = await fetch('https://learning-development-monitoring-system.vercel.app/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });
            const data = await response.json();

            if (data.success) {
                setAdminAuthenticated(true);
                setEmployeeProfile(data.profile);
                setUserAuthenticated(false);
                localStorage.setItem('isAdminAuthenticated', 'true');
                localStorage.removeItem('isUserAuthenticated');
                navigate(`/employeeProfile/${data.profile.id}`);
            } else {
                alert('Invalid credentials');
            }
        } catch (error) {
            console.error('Error admin login', error);
        }
    };

    const handleEmployeeLogin = async (credentials) => {
        try {
            const response = await fetch('https://learning-development-monitoring-system.vercel.app/employees/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });
            const data = await response.json();

            if (data.success) {
                setUserAuthenticated(true);
                setAdminAuthenticated(false);
                setEmployeeProfile({ id: data.employeeId, username: credentials.username });
                localStorage.setItem('isUserAuthenticated', 'true');
                localStorage.removeItem('isAdminAuthenticated');
                navigate(`/employeeDetailPage/${data.employeeId}`);
            } else {
                alert('Invalid credentials');
            }
        } catch (error) {
            console.error('Error employee login', error);
        }
    };

    const handleAddEmployee = async (newEmployee) => {
        try {
            const response = await fetch('https://learning-development-monitoring-system.vercel.app/employees/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newEmployee),
            });
            const data = await response.json();

            if (data.success) {
                alert('Employee added successfully!');
                setReloadEmployees(true);
            } else {
                alert('Error adding employee data');
            }
        } catch (error) {
            console.error('Error during employee adding', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isAdminAuthenticated');
        localStorage.removeItem('isUserAuthenticated');
        setAdminAuthenticated(false);
        setUserAuthenticated(false);
    };

    const toggleAdminLogin = () => {
        const adminLoginSection = document.querySelector('.adminLogin');
        const employeeLoginSection = document.querySelector('.employeeLogin');
        if (adminLoginSection.style.display === 'none') {
            employeeLoginSection.style.display = 'none';
            adminLoginSection.style.display = 'block';
        } else {
            adminLoginSection.style.display = 'none';
            employeeLoginSection.style.display = 'block';
        }
    };

    useEffect(() => {
        const handleKeyPress = (event) => {
            if (event.ctrlKey && event.altKey && event.key === 'a') {
                toggleAdminLogin();
            }
        };

        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, []);

    // Check if the current path is '/view-employee-profile/:employeeId'
    const isViewEmployeeProfile = location.pathname.includes('/view-employee-profile/');

    return (
        <div className="App">
            <div className='titleMain'>
                <h1>Learning and Development Monitoring System</h1>
                {!isViewEmployeeProfile && (isAdminAuthenticated || isUserAuthenticated) && (
                    <button className='logoutbtn' onClick={handleLogout}>Logout</button>
                )}
            </div>
            <div className='mainFlex'>
                <Routes>
                    <Route
                        path="/view-employee-profile/:employeeId"
                        element={<ViewEmployeeProfile />}
                    />
                </Routes>
                {!isViewEmployeeProfile && !isAdminAuthenticated && !isUserAuthenticated && (
                    <>
                        <div className="loginSection employeeLogin">
                            <EmployeeLogin onLogin={handleEmployeeLogin} navigate={navigate} />
                        </div>
                        <img alt='logo' className='logoPDRRMO' src={pdrrmoLogo} />
                        <div className="loginSection adminLogin" style={{ display: 'none' }}>
                            <TrainingData onLogin={handleAdminLogin} setAdminAuthenticated={setAdminAuthenticated} />
                        </div>
                    </>
                )}
                {(isAdminAuthenticated || isUserAuthenticated) && !isViewEmployeeProfile && (
                    <Routes>
                        <Route
                            path="/employeeProfile/:id"
                            element={<EmployeeProfile firstName={employeeProfile?.first_name} />}
                        />
                        {isUserAuthenticated && (
                            <Route
                                path="/employeeDetailPage/:employeeId"
                                element={<EmployeeDetailPage employeeId={employeeProfile?.id} />}
                            />
                        )}
                    </Routes>
                )}
                {isAdminAuthenticated && !isViewEmployeeProfile && (
                    <div className='adminMainFunction'>
                        <div className='adminAddingFunction'>
                            <EmployeeAddForm onAddEmployee={handleAddEmployee} />
                            <EmployeeListView employees={[]} />
                        </div>
                        <div className='adminAllEmployee'>
                            <AllTrainingList></AllTrainingList>
                        </div>
                    </div>
                )}
            </div>
            <button onClick={toggleAdminLogin} style={{ display: 'none' }}>Reveal Admin Login</button>
            {!isViewEmployeeProfile && (
                <footer className='footerData'><h2>#MindoreñoLagingAlerto</h2></footer>
            )}
        </div>
    );
}

export default App;
