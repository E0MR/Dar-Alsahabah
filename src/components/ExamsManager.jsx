import React, { useState, useEffect } from "react";
import { Table, Input, Badge, Container } from "reactstrap";
import { db } from "../db";

const PeriodicExams = () => {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState({}); // لتخزين الدرجات مؤقتاً {studentId-subjectId: score}

  // جلب البيانات الأساسية
  useEffect(() => {
    const fetchData = async () => {
      const allStudents = await db.students.toArray();
      const allSubjects = await db.subjects.toArray();
      setStudents(allStudents);
      setSubjects(allSubjects);
    };
    fetchData();
  }, []);

  // تحديث الدرجة في قاعدة البيانات
  const handleGradeChange = async (studentId, subjectId, score) => {
    // منطق الحفظ في IndexedDB
    await db.grades.put({
      sessionId: 1, // سنغيره لاحقاً ليكون ديناميكياً
      studentId,
      subjectId,
      score: Number(score),
    });
    // تحديث الحالة محلياً لسرعة العرض
    setGrades((prev) => ({ ...prev, [`${studentId}-${subjectId}`]: score }));
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
                    placeholder="-"
                    className="text-center border-0"
                    onChange={(e) =>
                      handleGradeChange(student.id, sub.id, e.target.value)
                    }
                  />
                </td>
              ))}
              <td className="fw-bold text-primary">0</td>{" "}
              {/* سيتم حساب المجموع تلقائياً */}
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};
