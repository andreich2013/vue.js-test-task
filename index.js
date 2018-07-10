Vue.use(VueMaterial.default);

const initialData = {
  employees: [
    {id:'4F0C3B4C-D8D8-4F01-9D9D-03758936EC05', name:'Иванов', price:500},
    {id:'A518B7DC-6BB2-4945-AC10-06A296660BDC', name:'Петров', price:250},
    {id:'7B1D6B3F-F986-4E5A-92FD-0CB361140A23', name:'Сидоров', price:1000}
  ],
  jobs: [
    {id:'CAACE586-37BC-454E-8FAF-0FEC73C69969', name:'Разработка сервера', user_id:'7B1D6B3F-F986-4E5A-92FD-0CB361140A23', time: 42},
    {id:'A08E2244-E864-4304-BEDF-124D7A447135', name:'Разработка интерфейса', user_id:'4F0C3B4C-D8D8-4F01-9D9D-03758936EC05', time: 56},
    {id:'143B5AB2-C63F-4D56-880C-126BC5DFAE4A', name:'Написание инструкции', user_id:'A518B7DC-6BB2-4945-AC10-06A296660BDC', time: 2.5}
  ]
};

const prepare = value => value.toString().toLowerCase();

const filterBy = (items = [], value = '') => {
  if (!value) {
    return items;
  }

  value = prepare(value);

  return items.filter(next => {
    return prepare(next.name).includes(value) || prepare(next.employee.name).includes(value);
  });
}

const isStable = (item) => {
  if (!item.stableCopy) {
    return false;
  }

  const stable = JSON.parse(item.stableCopy);

  const result = stable.id === item.id
                 && stable.name === item.name
                 && stable.employee && item.employee
                 && stable.employee.id === item.employee.id
                 && stable.employeeName === item.employeeName
                 && stable.time === item.time;

  return result;
};

const rehydrate = (item) => {
  if (!item.stableCopy) {
    return item;
  }

  Object.assign(item, JSON.parse(item.stableCopy));

  return item;
};

const component = new Vue({
  el: '#app',
  data: () => ({
    search: null,
    searched: [],
    items: [],
    employees: [],
    employeeId: null,
    isTouched: false,
    itemForAction: null,
    isEmployeeDialogActive: false,
    isDeleteConfirmationActive: false,
    serverData: null
  }),
  methods: {
    create () {
      this.items.push({
        id: uuid.v1().toUpperCase(),
        name: null,
        employee: {},
        time: 0,
        isEditable: true,
        stableCopy: null
      });
    },
    update(item) {
      if (!item) {
        return;
      }

      item.isEditable = true;
    },
    save(item) {
      if (!item || !item.name || !item.employeeName || !item.time) {
        return;
      }

      item.isEditable = false;

      if (isStable(item)) {
        return;
      }

      item.stableCopy = JSON.stringify(item);

      this.isTouched = true;
      this.serverData = null;
    },
    cancel(item) {
      if (!item) {
        return;
      }

      if (!item.stableCopy) {
        this.remove(item);

        return;
      }

      item.isEditable = false;

      const index = this.items.indexOf(item);

      if (index < 0) {
        return;
      }

      this.items.splice(index, rehydrate(item));
    },
    remove(item) {
      if (!item) {
        return;
      }

      const index = this.items.indexOf(item);

      if (index < 0) {
        return;
      }

      this.items.splice(index, 1);
    },
    sendToServer() {
      if (!this.isTouched) {
        return;
      }

      const mappedData = this.items.map(next => ({
        id: next.id,
        name: next.name,
        user_id: next.employee.id,
        time: next.time
      }));

      this.serverData = JSON.stringify(mappedData, null, 2);
      this.isTouched = false;
    },
    deleteConfirmationOpen(item) {
      this.isDeleteConfirmationActive = true;
      this.itemForAction = item;
    },
    onDeleteConfirmationSuccess() {
      this.remove(this.itemForAction);

      this.isTouched = true;

      this.onDeleteConfirmationCancel();
    },
    onDeleteConfirmationCancel() {
      this.isDeleteConfirmationActive = false;
      this.itemForAction = null;
    },
    employeeDialogOpen(item) {
      if (!item.isEditable) {
        return;
      }

      this.isEmployeeDialogActive = true;
      this.itemForAction = item;
      this.employeeId = item.employee ? item.employee.id : null;
    },
    onEmployeeDialogSuccess() {
      if (this.itemForAction && this.employeeId) {
        this.itemForAction.employee = initialData.employees.find(item => item.id === this.employeeId) || {};
        this.itemForAction.employeeName = this.itemForAction.employee.name;
      }

      this.onEmployeeDialogCancel();
    },
    onEmployeeDialogCancel() {
      this.isEmployeeDialogActive = false;
      this.itemForAction = null;
      this.employeeId = null;
    }
  },
  computed: {
    searchOnTable() {
      this.searched = filterBy(this.items, this.search);
    },
    summary() {
      const summary = {
        time: 0,
        cost: 0,
        jobs: this.items.length
      };

      this.items.forEach(next => {
        const price = (next.employee && next.employee.price) || 0;

        summary.time += +next.time;
        summary.cost += (+next.time) * (+price);
      });

      return summary;
    }
  },
  created() {
    this.employees = initialData.employees;

    this.items = initialData.jobs.map(next => {
      next.isEditable = false;
      next.employee = initialData.employees.find(item => item.id === next.user_id) || {};
      next.employeeName = next.employee.name;
      next.cost = next.time * next.employee.price;
      next.stableCopy = JSON.stringify(next);

      return next;
    });
  }
});
