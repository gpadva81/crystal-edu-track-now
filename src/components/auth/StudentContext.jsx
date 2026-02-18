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
        // Fetch owned students (original parent_user_id FK)
        const ownedStudents = await base44.entities.Student.filter({
          parent_user_id: user.id,
        });

        // Fetch shared links via junction table
        const sharedLinks = await base44.entities.StudentParent.filter({
          parent_user_id: user.id,
        });
        const sharedIds = sharedLinks
          .map((sp) => sp.student_id)
          .filter((id) => !ownedStudents.some((s) => s.id === id));

        // Fetch shared student records
        const sharedStudents =
          sharedIds.length > 0
            ? await base44.entities.Student.filterIn("id", sharedIds)
            : [];

        // Merge + deduplicate
        const allStudents = [...ownedStudents, ...sharedStudents];
        setStudents(allStudents);

        const savedStudentId = localStorage.getItem("selectedStudentId");
        const selected = savedStudentId
          ? allStudents.find((s) => s.id === savedStudentId) || allStudents[0]
          : allStudents[0];

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
