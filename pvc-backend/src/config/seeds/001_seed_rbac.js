// src/config/seeds/001_seed_rbac.js
// ─────────────────────────────────────────────────────────────────────────────
// Seeds:
//   • Modules + actions (60 module-actions)
//   • 5 roles with permission assignments
//   • 7 staff users — all with known credentials for testing
// ─────────────────────────────────────────────────────────────────────────────
const bcrypt = require('bcryptjs');

// ── All 7 dummy accounts ──────────────────────────────────────────────────────
// Password for ALL accounts: Pvc@Admin2026
// (Capital P, lowercase vc, @, capital A, dmin2026)
const DUMMY_PASSWORD = 'Pvc@Admin2026';

const USERS = [
  { name: 'System Admin',      email: 'admin@pvcdist.com',          role: 'admin'           },
  { name: 'Rahul Sharma',      email: 'rahul.sharma@pvcdist.com',   role: 'sales_staff'     },
  { name: 'Priya Patel',       email: 'priya.patel@pvcdist.com',    role: 'warehouse_staff' },
  { name: 'Amit Goswami',      email: 'amit.goswami@pvcdist.com',   role: 'accountant'      },
  { name: 'Sneha Joshi',       email: 'sneha.joshi@pvcdist.com',    role: 'sales_staff'     },
  { name: 'Deepak Mehta',      email: 'deepak.mehta@pvcdist.com',   role: 'warehouse_staff' },
  { name: 'Kavita Nair',       email: 'kavita.nair@pvcdist.com',    role: 'viewer'          },
];

const MODULES = [
  { code: 'inventory',     label: 'Inventory Management',  sort_order: 1  },
  { code: 'suppliers',     label: 'Supplier Management',   sort_order: 2  },
  { code: 'customers',     label: 'Customer Management',   sort_order: 3  },
  { code: 'sales_orders',  label: 'Sales Orders',          sort_order: 4  },
  { code: 'delivery',      label: 'Delivery & Logistics',  sort_order: 5  },
  { code: 'invoices',      label: 'Invoices & Credit Notes',sort_order: 6 },
  { code: 'payments',      label: 'Payment Tracking',      sort_order: 7  },
  { code: 'reports',       label: 'Reports',               sort_order: 8  },
  { code: 'users',         label: 'User Management',       sort_order: 9  },
  { code: 'notifications', label: 'Notifications',         sort_order: 10 },
];

const ACTIONS = ['view', 'create', 'edit', 'delete', 'approve', 'export'];

// Curated permission sets per role
const ROLE_PERMISSIONS = {
  admin: null, // gets ALL permissions (handled separately)
  sales_staff: [
    ['customers','view'], ['customers','create'], ['customers','edit'],
    ['sales_orders','view'], ['sales_orders','create'], ['sales_orders','edit'],
    ['quotations','view'],   // note: quotations module-level
    ['inventory','view'],
    ['invoices','view'],
    ['payments','view'],
    ['notifications','view'],
  ],
  warehouse_staff: [
    ['inventory','view'], ['inventory','create'], ['inventory','edit'],
    ['delivery','view'],  ['delivery','create'],  ['delivery','edit'],
    ['sales_orders','view'],
    ['suppliers','view'],
    ['notifications','view'],
  ],
  accountant: [
    ['invoices','view'], ['invoices','create'], ['invoices','edit'], ['invoices','approve'],
    ['payments','view'], ['payments','create'],  ['payments','edit'],
    ['reports','view'],  ['reports','export'],
    ['customers','view'],
    ['suppliers','view'],
    ['notifications','view'],
  ],
  viewer: MODULES.map(m => [m.code, 'view']),
};

exports.seed = async (knex) => {
  // ── 1. Modules ──────────────────────────────────────────────────────────────
  await knex('auth_modules').del();
  await knex('auth_modules').insert(
    MODULES.map(m => ({ ...m, status: 'ACTIVE', created_at: new Date(), updated_at: new Date() }))
  );
  const dbModules = await knex('auth_modules');
  const modMap = Object.fromEntries(dbModules.map(m => [m.code, m.id]));

  // ── 2. Module Actions ────────────────────────────────────────────────────────
  await knex('auth_module_actions').del();
  const actionRows = [];
  for (const mod of dbModules) {
    for (const action of ACTIONS) {
      actionRows.push({
        module_id:  mod.id,
        action,
        label:      `${action.charAt(0).toUpperCase() + action.slice(1)} ${mod.label}`,
        status:     'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      });
    }
  }
  await knex('auth_module_actions').insert(actionRows);
  const dbActions = await knex('auth_module_actions');
  // key: "module_id:action" → id
  const actionMap = Object.fromEntries(dbActions.map(a => [`${a.module_id}:${a.action}`, a.id]));

  // ── 3. Permissions ───────────────────────────────────────────────────────────
  await knex('auth_permissions').del();
  const permRows = dbActions.map(a => ({
    resource:   dbModules.find(m => m.id === a.module_id)?.code,
    action:     a.action,
    status:     'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
  }));
  await knex('auth_permissions').insert(permRows);
  const dbPerms = await knex('auth_permissions');

  // ── 4. Roles ─────────────────────────────────────────────────────────────────
  await knex('auth_roles').del();
  const roleInserts = [
    { name: 'Admin',           slug: 'admin',           description: 'Full access. Bypasses all RBAC checks.',         is_system: 1 },
    { name: 'Sales Staff',     slug: 'sales_staff',     description: 'Manages quotations, orders and customers.',      is_system: 1 },
    { name: 'Warehouse Staff', slug: 'warehouse_staff', description: 'Manages inventory, stock and deliveries.',       is_system: 1 },
    { name: 'Accountant',      slug: 'accountant',      description: 'Manages invoices, payments and reports.',        is_system: 1 },
    { name: 'Viewer',          slug: 'viewer',          description: 'Read-only access to all modules.',               is_system: 1 },
  ].map(r => ({ ...r, status: 'ACTIVE', created_at: new Date(), updated_at: new Date() }));
  await knex('auth_roles').insert(roleInserts);
  const dbRoles = await knex('auth_roles');
  const roleMap = Object.fromEntries(dbRoles.map(r => [r.slug, r.id]));

  // ── 5. Role-Permission Mapping ───────────────────────────────────────────────
  await knex('auth_roles_permissions_mapping').del();

  // Admin: all permissions
  const adminMappings = dbPerms.map(p => ({
    role_id:          roleMap['admin'],
    permission_id:    p.id,
    module_action_id: actionMap[`${modMap[p.resource]}:${p.action}`] || dbActions[0].id,
    created_at:       new Date(),
  })).filter(m => m.module_action_id);
  if (adminMappings.length) await knex('auth_roles_permissions_mapping').insert(adminMappings);

  // Other roles: curated
  for (const [slug, perms] of Object.entries(ROLE_PERMISSIONS)) {
    if (slug === 'admin' || !perms) continue;
    const rows = [];
    for (const [modCode, action] of perms) {
      const modId = modMap[modCode];
      if (!modId) continue;
      const maId = actionMap[`${modId}:${action}`];
      if (!maId) continue;
      const perm = dbPerms.find(p => p.resource === modCode && p.action === action);
      if (!perm) continue;
      rows.push({ role_id: roleMap[slug], permission_id: perm.id, module_action_id: maId, created_at: new Date() });
    }
    if (rows.length) await knex('auth_roles_permissions_mapping').insert(rows).onConflict(['role_id','permission_id']).ignore();
  }

  // ── 6. Users ─────────────────────────────────────────────────────────────────
  await knex('auth_user_roles').del();
  await knex('auth_users').del();

  const hash = await bcrypt.hash(DUMMY_PASSWORD, 12);

  const userInserts = USERS.map(u => ({
    name:             u.name,
    email:            u.email,
    phone:            null,
    password_hash:    hash,
    is_active:        1,
    must_set_password:false,
    status:           'ACTIVE',
    created_at:       new Date(),
    updated_at:       new Date(),
  }));
  await knex('auth_users').insert(userInserts);
  const dbUsers = await knex('auth_users');
  const userEmailMap = Object.fromEntries(dbUsers.map(u => [u.email, u.id]));

  // Assign roles
  const userRoleRows = USERS.map(u => ({
    user_id:    userEmailMap[u.email],
    role_id:    roleMap[u.role],
    assigned_by:userEmailMap['admin@pvcdist.com'],
    created_at: new Date(),
  }));
  await knex('auth_user_roles').insert(userRoleRows);

  // ── Done ─────────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  PVC Admin — Seed Complete');
  console.log('═'.repeat(60));
  console.log('\n  DUMMY ACCOUNTS (all use the same password)');
  console.log('  ' + '─'.repeat(56));
  console.log('  Password for ALL accounts: Pvc@Admin2026');
  console.log('  ' + '─'.repeat(56));
  USERS.forEach(u => {
    const roleName = u.role.replace('_',' ').replace(/\b\w/g, c => c.toUpperCase());
    console.log(`  ${u.email.padEnd(38)} ${roleName}`);
  });
  console.log('\n  Modules: ' + MODULES.length + '  |  Actions: ' + actionRows.length + '  |  Roles: ' + roleInserts.length);
  console.log('═'.repeat(60) + '\n');
};
