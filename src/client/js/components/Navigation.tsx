import React, { useEffect } from 'react';
import { API, endpoints } from '@api';
import { RoleId, RoleName } from '@interfaces';
import { AdminTab, CombinedState } from '@store/state';
import {
  useLocation, useNavigate, Route, Routes, Navigate, useSearchParams,
} from 'react-router-dom';
import { getUserInfo } from '@admin/admin.store';
import Admin from '@admin/Admin';
import Dashboard from '@dashboard/Dashboard';

function Navigation() {
  const navigate = useNavigate();
  const { userinfo } = getUserInfo();
  const { pathname } = useLocation();
  const [host, activePath] = pathname.split('/');
  const defaultToAdminPage = [RoleName.admin, RoleName.director, RoleName.manager].includes(userinfo?.role);
  const defualtToTradeLog = [RoleName.seniorTrader].includes(userinfo?.role);
  const hasAdminAccess = [RoleName.admin, RoleName.director, RoleName.manager, RoleName.seniorTrader].includes(userinfo?.role);
  const [params] = useSearchParams();

  useEffect(() => {
    if (!userinfo) return;
    const link = params.get('link');
    if (link && link !== '/') {
      navigate(link);
      return;
    }
    if (!pathname) return;
    if (!hasAdminAccess && !activePath) {
      navigate(`${endpoints.dashboard}`);
    } else if (!activePath) {
      if (defaultToAdminPage) {
        navigate(`${endpoints.administration}/${AdminTab.Transfers}`);
      } else if (defualtToTradeLog) {
        navigate(`${endpoints.administration}/${AdminTab.Trades}`);
      }
    }
  }, [userinfo, activePath]);

  return (
    <>
      <Routes>
        {hasAdminAccess && <Route path={`${endpoints.administration}/*`} element={<Admin />} />}
        <Route path={`${endpoints.dashboard}/*`} element={<Dashboard />} />
      </Routes>
    </>);
}

export default React.memo(Navigation);
