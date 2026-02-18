import React, { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

const StudentContext = createContext();

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error("useStudent must be used within StudentProvider");
  }
  return context;
};

export const StudentProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentStudent, setCurrentStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStudentData();
    }
  }, [user]);

  const loadStudentData = async () => {
    try {
      if (user.account_type === "parent") {
        const parentStudents = await base44.entities.Student.filter({
          parent_user_id: user.id,
        });
        setStudents(parentStudents);

        const savedStudentId = localStorage.getItem("selectedStudentId");
        const selected = savedStudentId
          ? parentStudents.find(s => s.id === savedStudentId) || parentStudents[0]
          : parentStudents[0];

        setCurrentStudent(selected);
      } else {
        const studentProfile = await base44.entities.Student.filter({
          student_user_id: user.id,
        });

        if (studentProfile.length > 0) {
          setCurrentStudent(studentProfile[0]);
          setStudents(studentProfile);
        }
      }
    } catch (error) {
      console.error("Error loading student data:", error);
    } finally {
      setLoading(false);
    }
  };

  const switchStudent = (studentId) => {
    const student = students.find((s) => s.id === studentId);
    if (student) {
      setCurrentStudent(student);
      localStorage.setItem("selectedStudentId", studentId);
    }
  };

  return (
    <StudentContext.Provider
      value={{
        currentStudent,
        user,
        students,
        loading,
        switchStudent,
        isParent: user?.account_type === "parent",
        refreshStudents: loadStudentData,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};
