import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  Table,
  Badge,
} from "reactstrap";
import { db } from "../db";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSearch,
  MdPrint,
} from "react-icons/md";
import { useReactToPrint } from "react-to-print";
import ConfirmModal from "../components/common/ConfirmModal";
import { useSession } from "../context/SessionContext";

const Students = () => {
  const { activeSessionId, sessions } = useSession();
  const activeSession = sessions.find(s => s.id === activeSessionId);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // حالات المودالات
  const [modal, setModal] = useState(false);
  const [certModal, setCertModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Confirmation state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    phone1: "",
    phone2: "",
    classId: "",
  });

  const printRef = useRef();

  const fetchData = useCallback(async () => {
    try {
      const [sData, cData, subData, gData] = await Promise.all([
        db.students.toArray(),
        db.classes.toArray(),
        db.subjects.toArray(),
        db.grades.toArray(),
      ]);
      setStudents(sData);
      setClasses(cData);
      setSubjects(subData);
      setGrades(gData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await fetchData();
    };
    load();
  }, [fetchData]);

  const toggleModal = () => {
    setModal(!modal);
    if (!modal) setFormData({ name: "", phone1: "", phone2: "", classId: "" });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (formData.id) await db.students.update(formData.id, formData);
    else await db.students.add(formData);
    fetchData();
    toggleModal();
  };

  const showCertificate = (student) => {
    setSelectedStudent(student);
    setCertModal(true);
  };

  const handleDeleteClick = (id) => {
    setTargetDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (targetDeleteId) {
      await db.students.delete(targetDeleteId);
      // Clean up grades for this student
      await db.grades.where({ studentId: targetDeleteId }).delete();
      fetchData();
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `شهادة - ${selectedStudent?.name}`,
  });

  // تصفية الطلاب بناءً على البحث
  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Container fluid className="p-4 rtl">
      <div className="d-flex justify-content-between align-items-center mb-4 mt-3">
        <h2 className="fw-bold m-0 text-primary">👨‍🎓 إدارة الطلاب</h2>
        <Button
          color="primary"
          className="rounded-pill px-4 shadow-sm"
          onClick={toggleModal}
        >
          <MdAdd size={22} /> إضافة طالب جديد
        </Button>
      </div>

      {/* شريط البحث */}
      <Card className="border-0 shadow-sm mb-4 rounded-4">
        <CardBody className="p-3">
          <div className="d-flex align-items-center bg-light px-3 py-2 rounded-pill">
            <MdSearch size={24} className="text-muted ms-2" />
            <Input
              type="text"
              placeholder="ابحث عن طالب بالاسم..."
              className="border-0 bg-transparent shadow-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      {/* جدول الطلاب */}
      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Table hover responsive className="text-center align-middle m-0">
          <thead className="table-dark">
            <tr>
              <th>م</th>
              <th>اسم الطالب</th>
              <th>رقم ولي الأمر 1</th>
              <th>رقم ولي الأمر 2</th>
              <th>الفصل</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((st, index) => (
              <tr key={st.id}>
                <td>{index + 1}</td>
                <td
                  className="fw-bold text-primary cursor-pointer"
                  style={{ cursor: "pointer" }}
                  onClick={() => showCertificate(st)}
                >
                  {st.name}
                </td>
                <td>{st.phone1 || "-"}</td>
                <td>{st.phone2 || "-"}</td>
                <td>
                  <Badge color="info" pill>
                    {classes.find((c) => c.id === Number(st.classId))?.title ||
                      "غير محدد"}
                  </Badge>
                </td>
                <td>
                  <Button
                    color="link"
                    className="text-info p-1"
                    onClick={() => {
                      setFormData(st);
                      setModal(true);
                    }}
                  >
                    <MdEdit size={18} />
                  </Button>
                  <Button
                    color="link"
                    className="text-danger p-1"
                    onClick={() => handleDeleteClick(st.id)}
                  >
                    <MdDelete size={18} />
                  </Button>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan="6" className="text-muted py-4">
                  لا توجد سجلات طلاب مطابقة
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>

      {/* مودال الإضافة/التعديل */}
      <Modal isOpen={modal} toggle={toggleModal} centered dir="rtl">
        <ModalHeader toggle={toggleModal}>بيانات الطالب</ModalHeader>
        <Form onSubmit={handleSave}>
          <ModalBody>
            <FormGroup>
              <Label>اسم الطالب</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </FormGroup>
            <Row>
              <Col md="6">
                <FormGroup>
                  <Label>رقم ولي الأمر 1</Label>
                  <Input
                    value={formData.phone1}
                    onChange={(e) =>
                      setFormData({ ...formData, phone1: e.target.value })
                    }
                  />
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label>رقم ولي الأمر 2</Label>
                  <Input
                    value={formData.phone2}
                    onChange={(e) =>
                      setFormData({ ...formData, phone2: e.target.value })
                    }
                  />
                </FormGroup>
              </Col>
            </Row>
            <FormGroup>
              <Label>الفصل</Label>
              <Input
                type="select"
                required
                value={formData.classId}
                onChange={(e) =>
                  setFormData({ ...formData, classId: e.target.value })
                }
              >
                <option value="">اختر الفصل...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </Input>
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" type="submit" className="px-4">
              حفظ
            </Button>
            <Button color="light" onClick={toggleModal}>
              إلغاء
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* مودال الشهادة (Certificate) */}
      <Modal
        isOpen={certModal}
        toggle={() => setCertModal(false)}
        size="lg"
        centered
        dir="rtl"
      >
        <ModalHeader toggle={() => setCertModal(false)} className="border-0">
          شهادة الطالب
        </ModalHeader>
        <ModalBody>
          <div
            ref={printRef}
            className="p-5 border bg-white shadow-sm rounded text-center position-relative"
          >
            <h1 className="fw-bold mb-1">شهادة تقدير</h1>
            <h4 className="text-muted mb-4">{activeSession ? activeSession.title : `للعام الدراسي ${new Date().getFullYear()}`}</h4>
            <div className="mb-4">
              <h5>
                يشهد المركز بأن الطالب:{" "}
                <span className="text-primary fw-bold">
                  {selectedStudent?.name}
                </span>
              </h5>
              <h6>
                المقيد بفصل:{" "}
                {
                  classes.find((c) => c.id === Number(selectedStudent?.classId))
                    ?.title
                }
              </h6>
            </div>

            <Table bordered className="mt-4 align-middle border-dark">
              <thead className="table-light border-dark">
                <tr>
                  <th>المادة</th>
                  <th>الدرجة النهائية</th>
                  <th>درجة الطالب</th>
                </tr>
              </thead>
              <tbody>
                {subjects
                  .filter((sub) => {
                    const cls = classes.find(
                      (c) => c.id === Number(selectedStudent?.classId),
                    );
                    return cls?.subjectIds && cls.subjectIds.includes(sub.id);
                  })
                  .map((sub) => {
                    // حساب مجموع درجات المادة (سواء كانت أجزاء أو كلي)
                    const studentGrades = grades.filter(
                      (g) =>
                        g.studentId === selectedStudent?.id &&
                        g.subjectId === sub.id &&
                        g.sessionId === activeSessionId
                    );
                    const totalObtained = studentGrades.reduce(
                      (sum, g) => sum + Number(g.score),
                      0,
                    );

                    return (
                      <tr key={sub.id}>
                        <td className="fw-bold">{sub.name}</td>
                        <td>{sub.maxGrade || 100}</td>
                        <td
                          className={
                            totalObtained < sub.maxGrade / 2
                              ? "text-danger fw-bold"
                              : "text-success fw-bold"
                          }
                        >
                          {totalObtained || 0}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </Table>
            <div className="d-flex justify-content-between mt-5">
              <div className="text-center" style={{ width: "150px" }}>
                <p className="mb-0 border-top pt-2">ختم المركز</p>
              </div>
              <div className="text-center" style={{ width: "150px" }}>
                <p className="mb-0 border-top pt-2">توقيع المدير</p>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="border-0">
          <Button color="dark" onClick={handlePrint}>
            <MdPrint /> طباعة الشهادة
          </Button>
          <Button color="light" onClick={() => setCertModal(false)}>
            إغلاق
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmModal
        isOpen={confirmOpen}
        toggle={() => setConfirmOpen(!confirmOpen)}
        onConfirm={confirmDelete}
        title="حذف الطالب"
        message="هل أنت متأكد من حذف هذا الطالب نهائياً؟"
      />
    </Container>
  );
};

export default Students;
