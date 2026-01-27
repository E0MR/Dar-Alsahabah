import React from "react";
import { Modal, ModalBody, ModalFooter, Button } from "reactstrap";
import { MdWarning } from "react-icons/md";

const ConfirmModal = ({
    isOpen,
    toggle,
    onConfirm,
    title = "تأكيد الإجراء",
    message = "هل أنت متأكد من المتابعة؟",
    confirmText = "تأكيد",
    cancelText = "إلغاء",
    confirmColor = "danger"
}) => {
    return (
        <Modal isOpen={isOpen} toggle={toggle} centered size="sm">
            <ModalBody className="text-center p-4">
                <div className={`text-${confirmColor} mb-3`}>
                    <MdWarning size={60} />
                </div>
                <h5 className="fw-bold mb-2">{title}</h5>
                <p className="text-muted small mb-0">
                    {message}
                </p>
            </ModalBody>
            <ModalFooter className="border-0 justify-content-center pt-0 pb-4">
                <Button
                    color="light"
                    className="rounded-pill px-4"
                    onClick={toggle}
                >
                    {cancelText}
                </Button>
                <Button
                    color={confirmColor}
                    className="rounded-pill px-4 shadow-sm"
                    onClick={() => {
                        onConfirm();
                        toggle();
                    }}
                >
                    {confirmText}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default ConfirmModal;
