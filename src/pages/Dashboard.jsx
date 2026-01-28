import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Container, Row, Col, Button } from "reactstrap";
import { db } from "../db";
import StatCard from "../components/StatCard";
import ActionButtons from "../components/ActionButtons";
import GenericModal from "../components/common/GenericModal";

const Dashboard = () => {
  const counts = useLiveQuery(async () => {
    const [cCount, sCount, stCount] = await Promise.all([
      db.classes.count(),
      db.subjects.count(),
      db.students.count(),
    ]);
    return { cCount, sCount, stCount };
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");

  const stats = [
    {
      title: "الفصول الدراسية",
      count: `${counts?.cCount || 0} فصل`,
      icon: "🏫",
    },
    {
      title: "المواد المسجلة",
      count: `${counts?.sCount || 0} مادة`,
      icon: "📚",
    },
    {
      title: "الطلاب النشطون",
      count: `${counts?.stCount || 0} طالب`,
      icon: "👨‍🎓",
    },
  ];

  const handleExport = async () => {
    try {
      const allData = {
        classes: await db.classes.toArray(),
        subjects: await db.subjects.toArray(),
        students: await db.students.toArray(),
      };
      const blob = new Blob([JSON.stringify(allData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dar_alsahaba_backup.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const showModal = (title, message) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalOpen(true);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        await db.transaction(
          "rw",
          [db.classes, db.subjects, db.students],
          async () => {
            await Promise.all([
              db.classes.clear(),
              db.subjects.clear(),
              db.students.clear(),
            ]);
            await Promise.all([
              db.classes.bulkAdd(json.classes || []),
              db.subjects.bulkAdd(json.subjects || []),
              db.students.bulkAdd(json.students || []),
            ]);
          },
        );
        showModal("نجاح", "تم استيراد البيانات بنجاح ✅");
      } catch (error) {
        console.error("Import failed:", error);
        showModal("خطأ", "الملف غير صالح!");
      }
    };
    reader.readAsText(file);
  };

  return (
    <Container className="mt-4">
      <Row className="text-center mb-5">
        <Col>
          <h1
            className="fw-bold display-4 mb-3"
            style={{ color: "var(--primary-color)" }}
          >
            دار الصحابة
          </h1>
          <p className="lead opacity-75 mb-4">نظام الإدارة والتقييم الدوري</p>
          <ActionButtons onExport={handleExport} onImport={handleImport} />
        </Col>
      </Row>

      <Row className="g-4 justify-content-center">
        {stats.map((box, i) => (
          <StatCard key={i} {...box} />
        ))}
      </Row>

      <GenericModal
        isOpen={modalOpen}
        toggle={() => setModalOpen(!modalOpen)}
        title={modalTitle}
        footer={
          <Button color="primary" onClick={() => setModalOpen(false)}>
            حسناً
          </Button>
        }
      >
        <p className="text-center fs-5">{modalMessage}</p>
      </GenericModal>
    </Container>
  );
};

export default Dashboard;
