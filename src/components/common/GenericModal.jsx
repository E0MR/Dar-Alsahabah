import React from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "reactstrap";

const GenericModal = ({
    isOpen,
    toggle,
    title,
    children,
    footer,
    size = "md"
}) => {
    return (
        <Modal isOpen={isOpen} toggle={toggle} size={size} centered>
            <ModalHeader toggle={toggle}>{title}</ModalHeader>
            <ModalBody>{children}</ModalBody>
            {footer && <ModalFooter>{footer}</ModalFooter>}
        </Modal>
    );
};

export default GenericModal;
