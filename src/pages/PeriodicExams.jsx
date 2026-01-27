import React, { useState, useEffect } from "react";
import {
  Container, Table, Button, Card, Row, Col, Badge,
  Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input
} from "reactstrap";
import { db } from "../db";
import { MdAdd, MdAssessment, MdPrint, MdCheckCircle, MdDelete, MdEdit } from "react-icons/md";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";
import { useSession } from "../context/SessionContext";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../components/common/ConfirmModal";

const PeriodicExams = () => {
  const { sessions, activeSessionId, setActiveSessionId, refreshSessions } = useSession();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [allGrades, setAllGrades] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);

  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetSessionId, setTargetSessionId] = useState(null);

  const [newSessionData, setNewSessionData] = useState({ title: "", date: new Date().toISOString().split('T')[0] });
  const [editSessionData, setEditSessionData] = useState({ id: null, title: "", date: "" });

  const batchRef = useRef();
  const [batchSession, setBatchSession] = useState(null);

  useEffect(() => {
    const loadBatchData = async () => {
      const cls = await db.classes.toArray();
      const st = await db.students.toArray();
      const gr = await db.grades.toArray();
      const sub = await db.subjects.toArray();
      setClasses(cls);
      setAllStudents(st);
      setAllGrades(gr);
      setAllSubjects(sub);
    };
    loadBatchData();
  }, []);

  const handleAddSession = async (e) => {
    e.preventDefault();
    if (!newSessionData.title) return;
    await db.examSessions.add({
      title: newSessionData.title,
      date: newSessionData.date
    });
    setNewSessionData({ title: "", date: new Date().toISOString().split('T')[0] });
    toggleModal();
    refreshSessions();
  };

  const handleDeleteSession = (id) => {
    setTargetSessionId(id);
    setConfirmOpen(true);
  };

  const confirmDeleteSession = async () => {
    await db.examSessions.delete(targetSessionId);
    await db.grades.where({ sessionId: targetSessionId }).delete();
    refreshSessions();
    if (activeSessionId === targetSessionId) setActiveSessionId(0);
    setConfirmOpen(false);
  };

  const handleEditClick = (s) => {
    setEditSessionData(s);
    setEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    await db.examSessions.update(editSessionData.id, {
      title: editSessionData.title,
      date: editSessionData.date
    });
    setEditModal(false);
    refreshSessions();
  };

  const handlePrintBatch = useReactToPrint({
    contentRef: batchRef,
    documentTitle: `BatchSheets_${batchSession?.title}`,
    pageStyle: `@page { size: A4 landscape; margin: 10mm; }`,
  });

  const prepareAndPrintBatch = (s) => {
    setBatchSession(s);
    setTimeout(() => {
      handlePrintBatch();
    }, 200);
  };

  const toggleModal = () => setModal(!modal);

  const getGradesForBatch = (studentId, subjectId, paper, sessionId) => {
    return allGrades.find(g => g.studentId === studentId && g.subjectId === subjectId && g.paper === paper && g.sessionId === sessionId)?.score || '';
  };

  return (
    <Container fluid className="p-3 p-md-4 mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0 d-flex align-items-center gap-2">
            <MdAssessment className="text-primary" /> إدارة التقييمات الدورية
          </h2>
          <p className="text-muted mt-1 small">قم بإنشاء الاختبارات وإدارة النتائج لكل الفصول</p>
        </div>
        <Button color="primary" className="rounded-pill px-4 shadow-sm border-0 d-flex align-items-center gap-2" onClick={toggleModal}>
          <MdAdd size={20} /> إضافة اختبار جديد
        </Button>
      </div>

      <Row className="g-4">
        <Col md={12}>
          <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
            <Table hover responsive className="m-0 text-center align-middle">
              <thead className="table-dark">
                <tr>
                  <th className="text-start ps-4">عنوان الاختبار</th>
                  <th>التاريخ</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length > 0 ? (
                  sessions.map(s => (
                    <tr key={s.id} className={activeSessionId === s.id ? "table-primary border-primary border-start border-4" : ""}>
                      <td className="text-start ps-4 fw-bold">{s.title}</td>
                      <td>{s.date}</td>
                      <td>
                        {activeSessionId === s.id ? (
                          <Badge color="success" pill className="px-3">نشط حالياً</Badge>
                        ) : (
                          <Badge color="light" pill className="text-dark border px-3">مؤرشف</Badge>
                        )}
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <Button
                            size="sm"
                            color={activeSessionId === s.id ? "dark" : "primary"}
                            outline
                            className="rounded-pill px-3"
                            onClick={() => {
                              setActiveSessionId(s.id);
                              navigate("/classes");
                            }}
                          >
                            {activeSessionId === s.id ? "رصد الدرجات" : "تفعيل ورصد"}
                          </Button>
                          <Button
                            size="sm"
                            color="success"
                            outline
                            className="rounded-pill px-3 d-flex align-items-center gap-1"
                            onClick={() => prepareAndPrintBatch(s)}
                          >
                            <MdPrint size={16} /> كشوفات الفصول
                          </Button>
                          <Button
                            size="sm"
                            color="warning"
                            outline
                            className="rounded-pill p-2"
                            onClick={() => handleEditClick(s)}
                          >
                            <MdEdit size={16} />
                          </Button>
                          <Button
                            size="sm"
                            color="danger"
                            outline
                            className="rounded-pill p-2"
                            onClick={() => handleDeleteSession(s.id)}
                          >
                            <MdDelete size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-5 text-muted">لم يتم إضافة أي اختبارات بعد</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>
        </Col>
      </Row>

      {/* مودال التقييم الجديد */}
      <Modal isOpen={modal} toggle={toggleModal} centered dir="rtl">
        <ModalHeader toggle={toggleModal} className="border-0 fw-bold">إضافة تقييم دوري جديد</ModalHeader>
        <Form onSubmit={handleAddSession}>
          <ModalBody>
            <FormGroup>
              <Label>عنوان الاختبار (مثال: اختبار شهر مارس 2025)</Label>
              <Input
                required
                value={newSessionData.title}
                onChange={e => setNewSessionData({ ...newSessionData, title: e.target.value })}
                placeholder="ادخل اسم الاختبار..."
              />
            </FormGroup>
            <FormGroup>
              <Label>التاريخ</Label>
              <Input
                type="date"
                value={newSessionData.date}
                onChange={e => setNewSessionData({ ...newSessionData, date: e.target.value })}
              />
            </FormGroup>
          </ModalBody>
          <ModalFooter className="border-0">
            <Button color="primary" type="submit" className="rounded-pill px-4">إضافة</Button>
            <Button color="secondary" onClick={toggleModal} className="rounded-pill px-4">إلغاء</Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* مودال تعديل الاختبار */}
      <Modal isOpen={editModal} toggle={() => setEditModal(false)} centered dir="rtl">
        <ModalHeader toggle={() => setEditModal(false)} className="border-0 fw-bold">تعديل بيانات الاختبار</ModalHeader>
        <Form onSubmit={handleSaveEdit}>
          <ModalBody>
            <FormGroup>
              <Label>عنوان الاختبار</Label>
              <Input
                required
                value={editSessionData.title}
                onChange={e => setEditSessionData({ ...editSessionData, title: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <Label>التاريخ</Label>
              <Input
                type="date"
                value={editSessionData.date}
                onChange={e => setEditSessionData({ ...editSessionData, date: e.target.value })}
              />
            </FormGroup>
          </ModalBody>
          <ModalFooter className="border-0">
            <Button color="primary" type="submit" className="rounded-pill px-4">حفظ التغييرات</Button>
            <Button color="secondary" onClick={() => setEditModal(false)} className="rounded-pill px-4">إلغاء</Button>
          </ModalFooter>
        </Form>
      </Modal>

      <ConfirmModal
        isOpen={confirmOpen}
        toggle={() => setConfirmOpen(!confirmOpen)}
        onConfirm={confirmDeleteSession}
        title="حذف الاختبار"
        message="هل أنت متأكد من حذف هذا الاختبار؟ سيؤدي ذلك لحذف جميع الدرجات المرتبطة به نهائياً."
      />

      {/* --- Hidden Batch Print Component --- */}
      <div style={{ position: 'absolute', top: '-10000px', left: '-10000px', width: '210mm' }}>
        <div ref={batchRef}>
          {classes.map(cls => {
            const classStudents = allStudents.filter(st => st.classId === String(cls.id) || st.classId === Number(cls.id));
            const classSubjects = allSubjects.filter(sub => cls.subjectIds?.includes(sub.id));
            const basicSubjects = classSubjects.filter(s => s.isMain);
            const additionalSubjects = classSubjects.filter(s => !s.isMain);

            if (classStudents.length === 0) return null;

            return (
              <div key={cls.id} className="page-break-after p-4" style={{ pageBreakAfter: 'always', direction: 'rtl' }}>
                <div className="text-center mb-4">
                  <h2 className="fw-bold">كشف درجات فصل: {cls.title}</h2>
                </div>
                <Table bordered className="text-center align-middle border-dark table-sm" style={{ fontSize: '12px' }}>
                  <thead className="table-light border-dark">
                    <tr>
                      <th rowSpan="2" style={{ width: '40px' }}>م</th>
                      <th rowSpan="2" style={{ width: '180px' }}>اسم الطالب</th>
                      {basicSubjects.map(sub => (
                        <th key={sub.id} colSpan={sub.paperCount === 2 ? 2 : 1} rowSpan={sub.paperCount === 2 ? 1 : 2} className="bg-light">
                          {sub.name} ({sub.maxGrade})
                        </th>
                      ))}
                      <th rowSpan="2" style={{ width: '60px' }} className="bg-light fw-bold">المجموع</th>
                      {additionalSubjects.map(sub => (
                        <th key={sub.id} colSpan={sub.paperCount === 2 ? 2 : 1} rowSpan={sub.paperCount === 2 ? 1 : 2} className="bg-light">
                          {sub.name} ({sub.maxGrade})
                        </th>
                      ))}
                    </tr>
                    <tr>
                      {basicSubjects.map(sub => (
                        sub.paperCount === 2 ? (
                          <React.Fragment key={sub.id}>
                            <th style={{ fontSize: '10px' }}>{sub.paper1Name || 'و1'}</th>
                            <th style={{ fontSize: '10px' }}>{sub.paper2Name || 'و2'}</th>
                          </React.Fragment>
                        ) : null
                      ))}
                      {additionalSubjects.map(sub => (
                        sub.paperCount === 2 ? (
                          <React.Fragment key={sub.id}>
                            <th style={{ fontSize: '10px' }}>{sub.paper1Name || 'و1'}</th>
                            <th style={{ fontSize: '10px' }}>{sub.paper2Name || 'و2'}</th>
                          </React.Fragment>
                        ) : null
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((st, idx) => {
                      let total = 0;
                      return (
                        <tr key={st.id}>
                          <td>{idx + 1}</td>
                          <td className="text-start ps-2">{st.name}</td>
                          {basicSubjects.map(sub => (
                            sub.paperCount === 2 ? (
                              <React.Fragment key={sub.id}>
                                <td key={`${st.id}-${sub.id}-p1`}>{getGradesForBatch(st.id, sub.id, 1, batchSession?.id)}</td>
                                <td key={`${st.id}-${sub.id}-p2`}>{getGradesForBatch(st.id, sub.id, 2, batchSession?.id)}</td>
                                {(() => {
                                  const g1 = getGradesForBatch(st.id, sub.id, 1, batchSession?.id);
                                  const g2 = getGradesForBatch(st.id, sub.id, 2, batchSession?.id);
                                  total += Number(g1 || 0) + Number(g2 || 0);
                                  return null;
                                })()}
                              </React.Fragment>
                            ) : (
                              <td key={`${st.id}-${sub.id}`}>
                                {getGradesForBatch(st.id, sub.id, null, batchSession?.id)}
                                {(() => {
                                  const g = getGradesForBatch(st.id, sub.id, null, batchSession?.id);
                                  total += Number(g || 0);
                                  return null;
                                })()}
                              </td>
                            )
                          ))}
                          <td className="fw-bold">{total}</td>
                          {additionalSubjects.map(sub => (
                            sub.paperCount === 2 ? (
                              <React.Fragment key={sub.id}>
                                <td key={`${st.id}-${sub.id}-p1`}>{getGradesForBatch(st.id, sub.id, 1, batchSession?.id)}</td>
                                <td key={`${st.id}-${sub.id}-p2`}>{getGradesForBatch(st.id, sub.id, 2, batchSession?.id)}</td>
                              </React.Fragment>
                            ) : (
                              <td key={`${st.id}-${sub.id}`}>{getGradesForBatch(st.id, sub.id, null, batchSession?.id)}</td>
                            )
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              </div>
            );
          })}
        </div>
      </div>
    </Container>
  );
};

export default PeriodicExams;