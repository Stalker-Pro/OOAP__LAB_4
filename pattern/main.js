class Money {
	constructor(amount, currency = 'USD') {
		if (amount < 0) throw new Error('Amount cannot be negative')
		this._amount = amount
		this._currency = currency

		Object.freeze(this)
	}

	get amount() {
		return this._amount
	}
	get currency() {
		return this._currency
	}

	add(other) {
		if (this.currency !== other.currency) {
			throw new Error('Currencies must match')
		}
		return new Money(this.amount + other.amount, this.currency)
	}

	equals(other) {
		return this.amount === other.amount && this.currency === other.currency
	}

	toString() {
		return `${this._amount.toFixed(2)} ${this._currency}`
	}
}

class Email {
	constructor(value) {
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
			throw new Error('Invalid email')
		}
		this._value = value
		Object.freeze(this)
	}

	get value() {
		return this._value
	}

	equals(other) {
		return this._value === other._value
	}

	// Для удобного создания (альтернатива конструктору)
	static create(value) {
		return new Email(value)
	}
}

// Дополнительный класс для email-сообщений
class EmailMessage {
	constructor(email, subject, body) {
		this.email = email
		this.subject = subject
		this.body = body
		this.sentAt = new Date()
	}
}

class SMS {
	constructor(phoneNumber, text) {
		if (!/^\+?\d{10,15}$/.test(phoneNumber)) {
			throw new Error('Invalid phone number')
		}
		this._phoneNumber = phoneNumber
		this._text = text
		Object.freeze(this)
	}

	get phoneNumber() {
		return this._phoneNumber
	}
	get text() {
		return this._text
	}

	equals(other) {
		return this.phoneNumber === other.phoneNumber && this.text === other.text
	}
}

class Employee {
	constructor(name, baseSalary, email = null, phone = null) {
		this.name = name
		this.baseSalary = new Money(baseSalary, 'USD')
		this.id = Date.now().toString()

		// Генерируем случайный бонус 5-10%
		const bonusPercent = 5 + Math.random() * 5
		const bonusAmount = (baseSalary * bonusPercent) / 100
		this.bonus = new Money(bonusAmount, 'USD')

		// Добавляем контактные данные
		this.email = email ? new Email(email) : null
		this.phone = phone ? phone : null
	}

	// Итоговая зарплата (зарплата + бонус)
	get totalSalary() {
		return this.baseSalary.add(this.bonus)
	}
}

class Management {
	constructor() {
		this.accountBalance = new Money(0, 'USD') // Начальный баланс
		this.employees = []
		this.sentEmails = [] // История отправленных email
		this.sentSMS = [] // История отправленных SMS
		this.balanceElement = document.querySelector('.text__money-number')
		this.employeesContainer = document.querySelector(
			'.container__added-employers'
		)
		this.notificationContainer = document.querySelector(
			'.container__notification-employe'
		)
		this.updateBalanceUI() // Инициализируем отображение
	}

	// Пополнение счёта
	deposit(amount) {
		this.accountBalance = this.accountBalance.add(amount)
		this.updateBalanceUI()
	}

	updateBalanceUI() {
		if (this.balanceElement) {
			this.balanceElement.textContent = `${this.accountBalance.amount.toFixed(
				2
			)} ${this.accountBalance.currency}`
		}
	}

	addEmployee(name, salary) {
		const employee = new Employee(name, salary)
		this.employees.push(employee)
		this.renderEmployees()
		return employee
	}

	renderEmployees() {
		this.employeesContainer.innerHTML = ''
		this.employees.forEach(employee => {
			const employeeElement = document.createElement('div')
			employeeElement.className = 'employee-card'

			let contacts = ''
			if (employee.email) contacts += `Email: ${employee.email.value}<br>`
			if (employee.phone) contacts += `Телефон: ${employee.phone}`

			employeeElement.innerHTML = `
        <h3>${employee.name}</h3>
        <p>Зарплата: ${employee.baseSalary.toString()}</p>
        <p>Бонус: ${employee.bonus.toString()}</p>
        <p>Итого: ${employee.totalSalary.toString()}</p>
        ${contacts ? `<div class="contacts">${contacts}</div>` : ''}
      `

			this.employeesContainer.appendChild(employeeElement)
		})
	}

	// Выплата зарплат всем сотрудникам
	payOutSalaries() {
		// без параметров т.к. 'работаем' с this.employees
		if (!this.employees || this.employees.length === 0) {
			alert('Нет сотрудников для выплаты!')
			return
		}

		try {
			const total = this.calculateTotalSalaries()

			if (total.amount > this.accountBalance.amount) {
				throw new Error('Недостаточно средств на счету!')
			}

			this.accountBalance = new Money(
				this.accountBalance.amount - total.amount,
				this.accountBalance.currency
			)

			this.updateBalanceUI()
			alert(
				`Успешно выплачено ${total.amount.toFixed(2)} ${
					total.currency
				} всем сотрудникам!`
			)

			// Можно добавить логирование выплат
			console.log('Выплачено:', total, 'Остаток:', this.accountBalance)
		} catch (error) {
			console.error('Ошибка выплаты:', error)
			alert(error.message)
		}
	}

	calculateTotalSalaries() {
		return this.employees.reduce((total, emp) => {
			return total.add(emp.totalSalary)
		}, new Money(0, 'USD'))
	}

	// Метод для отправки уведомлений
	sendNotifications() {
		if (this.employees.length === 0) {
			alert('Нет сотрудников для отправки уведомлений!')
			return
		}

		this.notificationContainer.innerHTML = ''

		this.employees.forEach(employee => {
			const message = this.createNotificationMessage(employee)
			this.displayNotification(employee, message)

			// Отправляем email если есть
			if (employee.email) {
				const email = new EmailMessage(
					employee.email,
					'Уведомление о зарплате',
					message
				)
				this.sentEmails.push(email)
			}

			// Отправляем SMS если есть
			if (employee.phone) {
				const sms = new SMS(
					employee.phone,
					message.substring(0, 160) // Ограничение длины смс
				)
				this.sentSMS.push(sms)
			}
		})

		// this.logSentNotifications()
	}

	// logSentNotifications() {
	// 	console.log('Отправленные email:', this.sentEmails)
	// 	console.log('Отправленные SMS:', this.sentSMS)
	// }

	// Текст уведомления
	createNotificationMessage(employee) {
		const salary = employee.baseSalary.toString()
		const bonus = employee.bonus.toString()
		const total = employee.totalSalary.toString()

		return (
			`Уважаемый(ая) ${employee.name}, ваша зарплата ${salary} ` +
			`и бонус ${bonus} были выплачены. Итого: ${total}`
		)
	}

	// Отображение уведомления
	displayNotification(employee, message) {
		const notificationElement = document.createElement('div')
		notificationElement.className = 'notification-message'
		notificationElement.innerHTML = `
            <strong>${employee.name}</strong>: ${message}
        `
		this.notificationContainer.appendChild(notificationElement)
	}
}

///////////////////////////////////////////////////////////
//ИСПОЛЬЗУЕМ
//Обновление БАЛАНСА

document.addEventListener('DOMContentLoaded', () => {
	const management = new Management()
	management.deposit(new Money(10000, 'USD')) // Стартовый баланс

	// Обработчик кнопки выплаты зарплат
	document.querySelector('.btn__paySalaries').addEventListener('click', () => {
		management.payOutSalaries()
	})

	// Обработчик кнопки отправки уведомлений
	document
		.querySelector('.btn__sendNotification')
		.addEventListener('click', () => {
			management.sendNotifications()
		})

	// Единый обработчик добавления сотрудника
	document.querySelector('.btn__add-employ').addEventListener('click', () => {
		const nameInput = document.querySelector('input[name="name"]')
		const salaryInput = document.querySelector('input[name="salary"]')
		const emailInput = document.querySelector('input[name="email"]')
		const phoneInput = document.querySelector('input[name="phone"]')

		if (nameInput.value.trim() && salaryInput.value.trim()) {
			try {
				management.addEmployee(
					nameInput.value.trim(),
					parseFloat(salaryInput.value),
					emailInput?.value.trim() || null,
					phoneInput?.value.trim() || null
				)

				// Очищаем ВСЕ поля
				nameInput.value = ''
				salaryInput.value = ''
				if (emailInput) emailInput.value = ''
				if (phoneInput) phoneInput.value = ''
			} catch (error) {
				alert(`Ошибка: ${error.message}`)
			}
		} else {
			alert('Заполните обязательные поля (имя и зарплата)!')
		}
	})
})
