import React from 'react';
import Card from 'react-bootstrap/Card';
import Labels from '@application/Labels';
import { createSelector } from 'reselect';
import { useSelector } from 'react-redux';
import { IApplication } from '@interfaces';

const selectApp = createSelector([
  (state: { app: IApplication }) => state.app,
],
(app) => app);
export default React.memo(function AppListItemView() {
  const app = useSelector(selectApp);
  return (
  <Card>
    <Card.Header><h5>{Labels.ClientInformation}</h5></Card.Header>
    <Card.Body>
      <span>{app.id}</span>
    </Card.Body>
  </Card>
  );
});
