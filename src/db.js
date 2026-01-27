import Dexie from "dexie";

export const db = new Dexie("DarAlSahabaDB");

db.version(1).stores({
  classes: "++id, title, subjectIds",
  subjects: "++id, name, isMain, maxGrade, paperCount, paper1Name, paper2Name",
  students: "++id, name, classId",
  examSessions: "++id, title, date",
  grades:
    "++id, [sessionId+studentId+subjectId], [studentId+subjectId+paper], sessionId, studentId, subjectId, score, paper",
});
