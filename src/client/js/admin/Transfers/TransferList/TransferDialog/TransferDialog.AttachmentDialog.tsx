import React from 'react';
import Button from 'react-bootstrap/esm/Button';
import { PostRequestDialog as labels } from '@client/js/labels';
import Image from 'react-bootstrap/esm/Image';
import {
  Dropdown,
} from 'react-bootstrap';
import PlannerIcon from '@client/images/planner.svg';
import DocuSignIcon from '@client/images/docusign.png';
import { useDocument } from '@client/js/admin/admin.store';
import AttachFile from '@mui/icons-material/AttachFile';

function attachment(props: {
  requestId: number;
  uiType: 'button'|'menuItem';
}) {
  const { requestId, uiType } = props;
  const { document } = useDocument(requestId);
  const valueIsBlank = !document?.documentLink;
  const valueIsTaskLink = !valueIsBlank && document?.documentLink.startsWith('https://tasks.office.com');
  const valueIsDocuSignLink = !valueIsBlank && document?.documentLink.startsWith('https://app.docusign.com');
  const openLink = () => (document?.documentLink) && window.open(document?.documentLink, '_blank');

  if (!document?.id) return null;
  if (uiType === 'button') {
    return (
    <>
    {valueIsTaskLink && <Button onClick={openLink} variant='outline-secondary'><Image src={PlannerIcon} height={20} /> {labels.openTask}</Button>}
    {valueIsDocuSignLink && <Button onClick={openLink} variant='outline-secondary'><Image src={DocuSignIcon} height={20} /> {labels.openDocuSign}</Button>}
    {document.documentLink && !(valueIsTaskLink || valueIsDocuSignLink) && <Button onClick={openLink} variant='outline-secondary'> <AttachFile/> {labels.openAttachment}</Button>}
    </>
    );
  }
  if (uiType === 'menuItem') {
    return (
    <>
    {valueIsTaskLink && <Dropdown.Item onClick={openLink} ><Image src={PlannerIcon} height={20} />{labels.openTask}</Dropdown.Item>}
    {valueIsDocuSignLink && <Dropdown.Item onClick={openLink} ><Image src={DocuSignIcon} height={20} />{labels.openDocuSign}</Dropdown.Item>}
    {document.documentLink && !(valueIsTaskLink || valueIsDocuSignLink) && <Dropdown.Item onClick={openLink} >{labels.openAttachment}</Dropdown.Item>}

    </>);
  }
  return null;
}

export const Attachment = React.memo(attachment);
