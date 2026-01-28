import React, { useState, useEffect } from "react";
import { Table, Input, Badge, Container } from "reactstrap";
import { db } from "../db";

const PeriodicExams = () => {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const allStudents = await db.students.toArray();
      const allSubjects = await db.subjects.toArray();
      setStudents(allStudents);
      setSubjects(allSubjects);
    };
    fetchData();
  }, []);

  const handleGradeChange = async (studentId, subjectId, score) => {
    await db.grades.put({
      sessionId: 1,
      studentId,
      subjectId,
      score: Number(score),
    });

    setGrades((prev) => ({ ...prev, [`${studentId}-${subjectId}`]: score }));
  };

  const calculateTotal = (studentId) => {
    return subjects.reduce((sum, sub) => {
      const grade = grades[`${studentId}-${sub.id}`];
      return sum + (Number(grade) || 0);
    }, 0);
  };

  return (
    <Container fluid className="mt-4 overflow-auto">
      <Table
        bordered
        hover
        responsive
        className="text-center bg-white shadow-sm"
      >
        <thead className="table-dark">
          <tr>
            <th className="align-middle">اسم الطالب</th>
            {subjects.map((sub) => (
              <th key={sub.id}>{sub.name}</th>
            ))}
            <th className="align-middle bg-primary">المجموع</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td className="fw-bold">{student.name}</td>
              {subjects.map((sub) => (
                <td key={sub.id} style={{ width: "100px" }}>
                  <Input
                    type="number"
                    name={`grade-${student.id}-${sub.id}`}
                    placeholder="-"
                    className="text-center border-0"
                    value={grades[`${student.id}-${sub.id}`] || ""}
                    onChange={(e) =>
                      handleGradeChange(student.id, sub.id, e.target.value)
                    }
                  />
                </td>
              ))}
              <td className="fw-bold text-primary">{calculateTotal(student.id)}</td>{" "}
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default PeriodicExams;
