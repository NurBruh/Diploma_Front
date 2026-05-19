import React from 'react';
import RoleDashboardView from '../shared/RoleDashboardView';

const AdvisorDashboard = (props) => (
  <RoleDashboardView
    {...props}
    title="Мои студенты"
    subtitle={props.currentUser?.fullName}
    showBankColumns={false}
  />
);

export default AdvisorDashboard;
