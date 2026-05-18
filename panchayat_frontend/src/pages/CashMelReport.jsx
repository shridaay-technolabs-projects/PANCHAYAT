import React, { useState } from "react";
import {
    Box,
    HStack,
    Select,
    Button,
    useToast,
    Icon,
} from "@chakra-ui/react";
import { FiPrinter } from "react-icons/fi";
import { useRef } from "react";
const formatDateInput = (value) => {
    // only digits
    const digits = value.replace(/\D/g, "");

    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    if (digits.length <= 8)
        return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;

    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
};

// DateInput component (simplified for this artifact)
const DateInput = ({ label, name, value, onDateChange }) => {
    return (
        <Box>
            <label style={{ fontSize: "14px", fontWeight: 600 }}>
                {label}
            </label>

            <input
                type="text"
                placeholder="DD/MM/YYYY"
                value={value || ""}
                maxLength={10}

                onChange={(e) => {
                    const formatted = formatDateInput(e.target.value);
                    onDateChange(name, formatted);
                }}

                style={{
                    width: "150px",
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    marginTop: "4px",
                }}
            />
        </Box>
    );
};



const CashMelReport = ({ apiBase, customCategories, banks, user }) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    // 🔥 Function to generate financial years (last 5 years)
    const getFinancialYears = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = 5; i >= 0; i--) {
            const startYear = currentYear - i;
            const endYear = startYear + 1;
            years.push({
                value: `${startYear}`,
                label: `${startYear}-${String(endYear).slice(-2)}`
            });
        }
        return years;
    };

    // 🔥 Function to get date range from financial year
    const getDateRangeFromFY = (fyValue) => {
        if (!fyValue) return { from: "", to: "" };
        const year = parseInt(fyValue);

        // Convert to display format (DD/MM/YYYY)
        return {
            from: `01/04/${year}`,
            to: `31/03/${year + 1}`
        };
    };

    // 🔥 Function to get months list for dropdown
    const getMonths = () => {
        return [
            { value: "01", label: "જાન્યુઆરી" },
            { value: "02", label: "ફેબ્રુઆરી" },
            { value: "03", label: "માર્ચ " },
            { value: "04", label: "એપ્રિલ " },
            { value: "05", label: "મે " },
            { value: "06", label: "જૂન " },
            { value: "07", label: "જુલાઈ " },
            { value: "08", label: "ઓગસ્ટ " },
            { value: "09", label: "સપ્ટેમ્બર " },
            { value: "10", label: "ઓક્ટોબર " },
            { value: "11", label: "નવેમ્બર " },
            { value: "12", label: "ડિસેમ્બર " }
        ];
    };

    // 🔥 Function to get years list for dropdown 
    const getYearsForMonthly = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = 10; i >= 0; i--) {
            const year = currentYear - i;
            years.push({ value: `${year}`, label: `${year}` });
        }
        return years;
    };

    // 🔥 Function to get date range from month and year
    const getDateRangeFromMonthYear = (month, year) => {
        if (!month || !year) return { from: "", to: "" };
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        
        let daysInMonth;
        if (monthNum === 2) {
            daysInMonth = (yearNum % 4 === 0 && yearNum % 100 !== 0) || (yearNum % 400 === 0) ? 29 : 28;
        } else if ([4, 6, 9, 11].includes(monthNum)) {
            daysInMonth = 30;
        } else {
            daysInMonth = 31;
        }
        
        const fromDate = `01/${String(monthNum).padStart(2, "0")}/${yearNum}`;
        const toDate = `${daysInMonth}/${String(monthNum).padStart(2, "0")}/${yearNum}`;
        
        return { from: fromDate, to: toDate };
    };

    const [report, setReport] = useState({
        from: "",
        to: "",
        type: "aavak",
        fy: "",
        selectedBank: "",
        selectedYear: "",
        checkType: "javak",
        selectedMonth: "",
        selectedYear_aavak: "",
        // 🔥 NEW: rojmel ke liye month/year/fullYear fields
        rojmelMonth: "",
        rojmelYear: "",
        rojmelFullYear: "",  // "full" = pura saal, "" = sirf month
    });

    const dateErrorShownRef = useRef(false);

    // 🔥 Utility Functions
    const convertToISO = (display) => {
        const [d, m, y] = display.split("/");
        if (!d || !m || !y || y.length !== 4) return "";
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    };

    const guj = (num) => {
        if (num === null || num === undefined || num === "") return "";
        
        // Convert to number
        const roundedNum = typeof num === 'number' ? num : parseFloat(num);
        if (isNaN(roundedNum)) return "";
        
        // Check if it's a whole number
        const formattedNum = Number.isInteger(roundedNum) ? 
            roundedNum.toString() : 
            roundedNum.toFixed(2);
        
        const gujaratiDigits = ["૦", "૧", "૨", "૩", "૪", "૫", "૬", "૭", "૮", "૯"];
        return formattedNum.replace(/\d/g, (d) => gujaratiDigits[parseInt(d)]);
    };

    const formatDateToGujarati = (display) => {
        if (!display) return "";
        return display.replace(/\d/g, (d) => guj(d));
    };

    const Date_To_Gujarati = (display) => {
        if (!display) return "";
        const [year, month, day] = display.split("-");
        const formatted = `${day}-${month}-${year}`;
        return formatted.replace(/\d/g, (d) => guj(d));
    };

    const formatDisplayDate = (input) => {
        const digits = input.replace(/\D/g, "").slice(0, 8);
        if (digits.length <= 2) return digits;
        if (digits.length <= 4) return digits.slice(0, 2) + "/" + digits.slice(2);
        if (digits.length <= 6) {
            const yy = digits.slice(4, 6);
            const yyyy = parseInt(yy) > 30 ? "19" + yy : "20" + yy;
            return digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + yyyy;
        }
        return digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
    };

    const hasRecordsInRange = (records, fromDate, toDate) => {
        return records.some(r => {
            if (!r.date) return false;
            const recordDate = r.date.slice(0, 10);
            return recordDate >= fromDate && recordDate <= toDate;
        });
    };

    const isFromAfterTo = (from, to) => {
        if (!from || !to) return false;
        if (from.length !== 10 || to.length !== 10) return false;
        const fromISO = convertToISO(from);
        const toISO = convertToISO(to);
        if (!fromISO || !toISO) return false;
        const f = new Date(fromISO);
        const t = new Date(toISO);
        f.setHours(0,0,0,0);
        t.setHours(0,0,0,0);
        return f > t;
    };

    const isFutureDate = (date) => {
        if (!date || date.length !== 10) return false;
        const iso = convertToISO(date);
        if (!iso) return false;
        const selected = new Date(iso);
        const today = new Date();
        selected.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        return selected > today;
    };

    const handleReportChange = (key, value) => {
        setReport((prev) => {
            const updated = { ...prev, [key]: value };

            // 🔥 Reset dates when report type changes
            if (key === "type") {
                updated.from = "";
                updated.to = "";
                updated.singleDate = "";
                updated.fy = "";
                updated.selectedYear = "";
                updated.selectedBank = "";
                updated.checkType = "javak"; // default for Check Issue
                updated.selectedMonth = "";
                updated.selectedYear_aavak = "";
                updated.rojmelMonth = "";
                updated.rojmelYear = "";
                updated.rojmelFullYear = "";
                updated.rojmelMode = "month";
                updated.aavakMode = "month";
                updated.aavakFullYear = "";
                dateErrorShownRef.current = false;
                return updated;
            }

            // 🔥 Handle aavakMode change
            if (key === "aavakMode" && (prev.type === "aavak" || prev.type === "javak")) {
                updated.from = "";
                updated.to = "";
                updated.selectedMonth = "";
                updated.selectedYear_aavak = "";
                updated.aavakFullYear = "";
                return updated;
            }

            // 🔥 aavakFullYear handler
            if (key === "aavakFullYear" && (prev.type === "aavak" || prev.type === "javak")) {
                if (value) {
                    const { from, to } = getDateRangeFromFY(value);
                    updated.from = from;
                    updated.to = to;
                }
                return updated;
            }

            // 🔥 Handle rojmelMode change - clear related fields
            if (key === "rojmelMode" && prev.type === "rojmel") {
                updated.from = "";
                updated.to = "";
                updated.rojmelMonth = "";
                updated.rojmelYear = "";
                updated.rojmelFullYear = "";
                return updated;
            }

            // 🔥 NEW: Rojmel month/year change handler
            if ((key === "rojmelMonth" || key === "rojmelYear") && prev.type === "rojmel") {
                const month = key === "rojmelMonth" ? value : prev.rojmelMonth;
                const year = key === "rojmelYear" ? value : prev.rojmelYear;
                if (month && year) {
                    const { from, to } = getDateRangeFromMonthYear(month, year);
                    updated.from = from;
                    updated.to = to;
                }
                updated.rojmelFullYear = ""; // clear full year selection
                return updated;
            }

            // 🔥 NEW: Rojmel full year change handler
            if (key === "rojmelFullYear" && prev.type === "rojmel") {
                if (value) {
                    const { from, to } = getDateRangeFromFY(value);
                    updated.from = from;
                    updated.to = to;
                }
                return updated;
            }

            // 🔥 If Month is selected for aavak/javak, auto-set from and to dates
            if (key === "selectedMonth" && value && (prev.type === "aavak" || prev.type === "javak")) {
                const { from, to } = getDateRangeFromMonthYear(value, prev.selectedYear_aavak);
                updated.from = from;
                updated.to = to;
                return updated;
            }

            if (key === "selectedYear_aavak" && value && (prev.type === "aavak" || prev.type === "javak")) {
                const { from, to } = getDateRangeFromMonthYear(prev.selectedMonth, value);
                updated.from = from;
                updated.to = to;
                return updated;
            }

            if (key === "fy" && value) {
                const { from, to } = getDateRangeFromFY(value);
                updated.from = from;
                updated.to = to;
                return updated;
            }

            if (key === "selectedYear" && value && prev.type === "checkIssue") {
                const { from, to } = getDateRangeFromFY(value);
                updated.from = from;
                updated.to = to;
                return updated;
            }

            if ((key === "from" || key === "to") && value.length < 10) {
                dateErrorShownRef.current = false;
                return updated;
            }

            if (isFutureDate(value)) {
                if (!dateErrorShownRef.current) {
                    toast({
                        title: "તારીખ માન્ય નથી",
                        description: "ભવિષ્યની તારીખ પસંદ કરી શકાતી નથી",
                        status: "error",
                        duration: 2500,
                        position: "top",
                    });
                    dateErrorShownRef.current = true;
                }
                return prev;
            }

            if (
                updated.from?.length === 10 &&
                updated.to?.length === 10 &&
                isFromAfterTo(updated.from, updated.to)
            ) {
                if (!dateErrorShownRef.current) {
                    toast({
                        title: "તારીખ ખોટી છે",
                        description: "From તારીખ To તારીખથી મોટી હોઈ શકે નહીં",
                        status: "error",
                        duration: 2500,
                        position: "top",
                    });
                    dateErrorShownRef.current = true;
                }
                return prev;
            }

            dateErrorShownRef.current = false;
            return updated;
        });
    };

    const getGujaratiFinancialYear = (isoDate) => {
        if (!isoDate) return "";
        const d = new Date(isoDate);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        let fyStart, fyEnd;
        if (month < 4) {
            fyStart = year - 1;
            fyEnd = year;
        } else {
            fyStart = year;
            fyEnd = year + 1;
        }
        return `${guj(fyStart)}–${guj(fyEnd)}`;
    };

    // =====================================================================
    // 🔥 NEW: Generate all rojmel pages for a date range using pre-fetched records
    // =====================================================================
    const generateRojmelPages = async (datesWithRecords, allRecords, templateFile, talukoName, fromDate) => {
        // Group records by date (YYYY-MM-DD)
        const recordsByDate = {};
        allRecords.forEach(r => {
            if (!r.date) return;
            const d = r.date.slice(0, 10);
            if (!recordsByDate[d]) recordsByDate[d] = [];
            recordsByDate[d].push(r);
        });

        // Precompute running balance and account balances before each date
        const sortedDates = Object.keys(recordsByDate).sort();
        const runningBalanceBeforeDate = {};
        const accountBalancesBeforeDate = {};

        let runningBalance = 0;
        let cashBalance = 0;
        const bankBalances = {};

        sortedDates.forEach(date => {
            runningBalanceBeforeDate[date] = runningBalance;
            accountBalancesBeforeDate[date] = { cash: cashBalance, ...bankBalances };

            const dayRecords = recordsByDate[date];
            let dayAavakSum = 0;
            let dayJavakSum = 0;

            dayRecords.forEach(r => {
                const amt = Number(r.amount || 0);
                if (r.vyavharType === "aavak") {
                    dayAavakSum += amt;
                } else if (r.vyavharType === "javak") {
                    dayJavakSum += amt;
                }

                const delta = (r.vyavharType === "aavak" ? 1 : -1) * amt;
                if (r.paymentMethod === "bank" && r.bank) {
                    bankBalances[r.bank] = (bankBalances[r.bank] || 0) + delta;
                } else {
                    cashBalance += delta;
                }
            });

            runningBalance += dayAavakSum - dayJavakSum;
        });

        const templateRes = await fetch(templateFile);
        if (!templateRes.ok) throw new Error("Template missing");
        const baseTemplate = await templateRes.text();
        const fyGujarati = getGujaratiFinancialYear(fromDate);

        const uniqueBanks = new Set();
        allRecords.forEach(r => {
            if (r.paymentMethod === "bank" && r.bank) uniqueBanks.add(r.bank);
        });

        const monthNamesGuj = [
            "જાન્યુઆરી", "ફેબ્રુઆરી", "માર્ચ", "એપ્રિલ", "મે", "જૂન",
            "જુલાઈ", "ઓગસ્ટ", "સપ્ટેમ્બર", "ઓક્ટોબર", "નવેમ્બર", "ડીસેમ્બર"
        ];

        let allPagesHTML = "";
        let negativeClosingDates = [];

        for (let i = 0; i < datesWithRecords.length; i++) {
            const dateISO = datesWithRecords[i];
            const dayRecords = recordsByDate[dateISO] || [];

            const openingAdd = dayRecords
                .filter(r => r.vyavharType === "aavak" && r.category === "ઉઘડતી સિલક")
                .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

            const openingBalance = (runningBalanceBeforeDate[dateISO] || 0) + openingAdd;

            const receiptGroups = {};
            dayRecords.forEach(r => {
                if (r.vyavharType === "aavak" && r.receiptPaymentNo) {
                    const key = r.receiptPaymentNo;
                    if (!receiptGroups[key]) {
                        receiptGroups[key] = {
                            receiptPaymentNo: r.receiptPaymentNo,
                            name: r.name,
                            date: r.date,
                            categories: {},
                            totalAmount: 0
                        };
                    }
                    const category = r.category || "અન્ય આવક";
                    receiptGroups[key].categories[category] = (receiptGroups[key].categories[category] || 0) + (r.amount || 0);
                    receiptGroups[key].totalAmount += (r.amount || 0);
                }
            });

            const dateMap = { [dateISO]: { aavak: [], javak: [] } };
            Object.values(receiptGroups).forEach(group => {
                dateMap[dateISO].aavak.push(group);
            });
            dayRecords.forEach(r => {
                if (r.vyavharType === "javak" && r.category !== "બેંક જમા") {
                    dateMap[dateISO].javak.push(r);
                }
            });

            const allAavakCategories = [
                "ઘર વેરો", "સા.પા વેરો", "ખા.પા વેરો", "સફાઈ વેરો",
                "ગટર/કુંડી વેરો", "વીજળી વેરો", "વ્યવસાય વેરો", "અન્ય આવક"
            ];
            const incomeColspan = allAavakCategories.length + 1;
            const totalIncomeCols = incomeColspan;
            const incomeHeadersHTML = allAavakCategories.map(cat => `<th>${cat}</th>`).join("");

            let totalAavakAmount = openingBalance;
            let totalJavakAmount = 0;
            const categoryTotals = {};
            allAavakCategories.forEach(cat => categoryTotals[cat] = 0);

            const day = dateMap[dateISO];
            const filteredAavak = day.aavak.filter(r => r.category !== "ઉઘડતી સિલક");
            const maxRows = Math.max(filteredAavak.length + 1, day.javak.length);

            let tableRows = "";
            let currentOpeningBalance = openingBalance;

            for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
                let a = null;
                if (rowIndex === 0) {
                    a = { name: "ઉઘડતી સિલક", amount: currentOpeningBalance };
                } else {
                    a = filteredAavak[rowIndex - 1];
                }

                const j = day.javak[rowIndex];
                let categoryCells = "";

                if (a && a.name !== "ઉઘડતી સિલક") {
                    let matchedCategory = false;
                    categoryCells = allAavakCategories.map(cat => {
                        const categoryAmount = a.categories?.[cat] || 0;
                        if (categoryAmount > 0) {
                            categoryTotals[cat] += categoryAmount;
                            totalAavakAmount += categoryAmount;
                            matchedCategory = true;
                            return `<td class="text-right">${guj(categoryAmount)}</td>`;
                        }
                        if (cat === "અન્ય આવક" && !matchedCategory) {
                            const otherCategories = Object.keys(a.categories || {}).filter(
                                c => !allAavakCategories.slice(0, -1).includes(c)
                            );
                            if (otherCategories.length > 0) {
                                const otherAmount = otherCategories.reduce((sum, c) => sum + (a.categories[c] || 0), 0);
                                if (otherAmount > 0) {
                                    categoryTotals[cat] += otherAmount;
                                    totalAavakAmount += otherAmount;
                                    matchedCategory = true;
                                    return `<td class="text-right">${guj(otherAmount)}</td>`;
                                }
                            }
                        }
                        return `<td class="text-right">૦</td>`;
                    }).join("");
                } else {
                    categoryCells = allAavakCategories.map(() => `<td class="text-right">૦</td>`).join("");
                }

                if (j) totalJavakAmount += j.amount;

                tableRows += `
<tr>
    <td>${a?.receiptPaymentNo ? guj(a.receiptPaymentNo) : ""}</td>
    <td>${a?.name || ""}</td>
    ${categoryCells}
    <td class="text-right">${a ? guj(a.totalAmount || a.amount || 0) : ""}</td>
    <td>${j?.ddCheckNum ? guj(j.ddCheckNum) : ""}</td>
    <td>${j?.receiptPaymentNo ? guj(j.receiptPaymentNo) : ""}</td>
    <td>${j?.name || ""}</td>
    <td>${j?.remarks || ""}</td>
    <td>${j?.category || ""}</td>
    <td class="text-right">${j ? guj(j.amount || 0) : ""}</td>
</tr>`;

                let dayAavak = 0;
                let dayJavak = 0;
                day.aavak.forEach(a => dayAavak += a.totalAmount || a.amount || 0);
                day.javak.forEach(j => dayJavak += j.amount || 0);
                currentOpeningBalance = currentOpeningBalance + dayAavak - dayJavak;
            }

            const totalCategoryCells = allAavakCategories.map(cat =>
                `<td class="text-right"><b>${guj(categoryTotals[cat])}</b></td>`
            ).join("");

            tableRows += `
<tr style="font-weight:bold;">
    <td></td>
    <td>કુલ આવક</td>
    ${totalCategoryCells}
    <td class="text-right">${guj(totalAavakAmount)}</td>
    <td colspan="5"></td>
    <td class="text-right">${guj(totalJavakAmount)}</td>
</tr>`;

            const bandhSilak = totalAavakAmount - totalJavakAmount;
            tableRows += `
<tr>
<td colspan="100%" style="font-weight:bold;text-align:right;">
    કુલ જાવક : ${guj(totalJavakAmount)}<br/>
    બંધ સિલક : ${guj(bandhSilak)}
</td>
</tr>`;

            const openingAccounts = accountBalancesBeforeDate[dateISO] || { cash: 0 };

            // Add当天 પાસે આવેલા ઉઘડતી સિલક entries to opening accounts in tapsil
            const openingSilakByAccount = dayRecords.reduce((acc, r) => {
                if (r.category === "ઉઘડતી સિલક" && r.vyavharType === "aavak") {
                    if (r.paymentMethod === "bank" && r.bank) {
                        acc.bank[r.bank] = (acc.bank[r.bank] || 0) + (Number(r.amount) || 0);
                    } else {
                        acc.cash += (Number(r.amount) || 0);
                    }
                }
                return acc;
            }, { cash: 0, bank: {} });

            const cashOpening = (openingAccounts.cash || 0) + openingSilakByAccount.cash;
           const { income: cashIncome, expense: cashExpense } = (() => {
    let income = 0;
    let expense = 0;
    dayRecords.forEach(r => {
        if (r.category === "ઉઘડતી સિલક" && r.vyavharType === "aavak") return;

        if (r.category === "બેંક જમા") {
            // ✅ SIRF JAVAK (rokad) entry count karo, AAVAK ignore karo
            if (r.vyavharType === "javak" && r.paymentMethod === "rokad") {
                expense += r.amount || 0;
            }
            return;
        }

        const match = r.paymentMethod !== "bank";
        if (match) {
            if (r.vyavharType === "aavak") income += r.amount || 0;
            else expense += r.amount || 0;
        }
    });
    return { income, expense };
})();

            const cashClosing = cashOpening + cashIncome - cashExpense;

            let accountTransferRows = "";
            let srNo = 1;
            let totalOpening = cashOpening;
            let totalIncome = cashIncome;
            let totalExpense = cashExpense;
            let totalClosing = cashClosing;

            if (cashClosing < 0) {
                negativeClosingDates.push(dateISO);
            }
            const cashRowStyle = cashClosing < 0 ? 'style="color:#b71c1c;font-weight:700;"' : '';
            accountTransferRows += `
<tr ${cashRowStyle}>
    <td>${guj(srNo++)}</td>
    <td>રોકડ</td>
    <td class="text-right">${guj(cashOpening)}</td>
    <td class="text-right">${guj(cashIncome)}</td>
    <td class="text-right">${guj(cashExpense)}</td>
    <td class="text-right">${guj(cashClosing)}</td>
</tr>`;

            for (const bankName of uniqueBanks) {
                const bankOpening = (openingAccounts[bankName] || 0) + (openingSilakByAccount.bank[bankName] || 0);
                const { income: bankIncome, expense: bankExpense } = (() => {
                    let income = 0;
                    let expense = 0;
                    dayRecords.forEach(r => {
                        if (r.category === "ઉઘડતી સિલક" && r.vyavharType === "aavak") return;
                        const match = r.paymentMethod === "bank" && r.bank === bankName;
                        if (match) {
                            if (r.vyavharType === "aavak") income += r.amount || 0;
                            else expense += r.amount || 0;
                        }
                    });
                    return { income, expense };
                })();
                const bankClosing = bankOpening + bankIncome - bankExpense;
                totalOpening += bankOpening;
                totalIncome += bankIncome;
                totalExpense += bankExpense;
                totalClosing += bankClosing;
                accountTransferRows += `
<tr>
    <td>${guj(srNo++)}</td>
    <td>${bankName}</td>
    <td class="text-right">${guj(bankOpening)}</td>
    <td class="text-right">${guj(bankIncome)}</td>
    <td class="text-right">${guj(bankExpense)}</td>
    <td class="text-right">${guj(bankClosing)}</td>
</tr>`;
            }

            accountTransferRows += `
<tr style="font-weight: bold; background: #f2f2f2;">
    <td colspan="2" class="text-center">કુલ રકમ</td>
    <td class="text-right">${guj(totalOpening)}</td>
    <td class="text-right">${guj(totalIncome)}</td>
    <td class="text-right">${guj(totalExpense)}</td>
    <td class="text-right">${guj(totalClosing)}</td>
</tr>`;

            const khataRowsSet = new Set();
            let khataFerfarRows = "";
            let khataSerialNo = 1;
            dayRecords.forEach(r => {
                // Only include explicit cash-to-bank transfers (bank deposit entries)
                // to avoid showing regular bank-based income categories as account transfer.
                if (r.vyavharType === 'aavak' && r.paymentMethod === 'bank' && r.category === "બેંક જમા") {
                    const key = `${r.date}-${r.amount}-${r.bank}-${r.remarks}`;
                    if (khataRowsSet.has(key)) return;
                    khataRowsSet.add(key);
                    const giver = 'રોકડ';
                    const receiver = r.bank || '';
                    const detail = r.remarks || r.category || '';
                    const amt = guj(r.amount || 0);
                    khataFerfarRows += `
<tr>
  <td>${guj(khataSerialNo++)}</td>
  <td class="text-left">${giver}</td>
  <td class="text-left">${receiver}</td>
  <td class="text-left">${detail}</td>
  <td class="text-right">${amt}</td>
</tr>`;
                }
            });

            const displayDate = `${dateISO.slice(8, 10)}/${dateISO.slice(5, 7)}/${dateISO.slice(0, 4)}`;
            let htmlTemplate = baseTemplate
                .replace("{{taluko}}", talukoName)
                .replace("{{yearRange}}", fyGujarati)
                .replace("{{dateRange}}", `${formatDateToGujarati(displayDate)} `)
                .replace("{{incomeHeaders}}", incomeHeadersHTML)
                .replace("{{tableRows}}", tableRows)
                .replace("{{totalIncomeCols}}", totalIncomeCols)
                .replace("{{incomeColspan}}", incomeColspan)
                .replace("{{accountTransferRows}}", accountTransferRows);

            htmlTemplate = htmlTemplate.replace("{}", khataFerfarRows);

            if (i > 0) {
                const [yr, mo] = dateISO.split("-");
                const monthGuj = monthNamesGuj[parseInt(mo, 10) - 1];
                const dispDateGuj = displayDate.replace(/\d/g, d => ["૦","૧","૨","૩","૪","૫","૬","૭","૮","૯"][parseInt(d)]);

                allPagesHTML += `
<div class="rojmel-date-separator">
  <span class="date-badge">📅 ${dispDateGuj}</span>
  <span class="date-label">તારીખ ${dispDateGuj} - ${monthGuj} ${yr.replace(/\d/g, d => ["૦","૧","૨","૩","૪","૫","૬","૭","૮","૯"][parseInt(d)])} નો રોજમેળ</span>
  <span class="date-line"></span>
  <span class="date-label" style="color:#388e3c;font-weight:700;">${i + 1} / ${datesWithRecords.length}</span>
</div>`;
            }

            allPagesHTML += `<div class="rojmel-page-wrapper${i > 0 ? ' rojmel-new-page' : ''}">${htmlTemplate}</div>`;

            // Add page break after each date (except the last one)
            if (i < datesWithRecords.length - 1) {
                allPagesHTML += `<div style="page-break-after: always;"></div>`;
            }
        }

        if (negativeClosingDates.length > 0) {
            const uniqueDates = [...new Set(negativeClosingDates)];
            const formattedDates = uniqueDates
                .map(d => Date_To_Gujarati(d))
                .join(", ");
            const warningHTML = `
<div style="margin-bottom: 12px; padding: 10px; border: 1px dashed #b71c1c; background: #ffebee; color: #b71c1c; font-weight: 700;">
  માઈનસ બંધ સિલક તારીખો: ${formattedDates}
</div>`;
            allPagesHTML = warningHTML + allPagesHTML;
        }

        return allPagesHTML;
    };

    // =====================================================================
    // 🔥 NEW: Get all dates in a range that have records
    // =====================================================================
    const getDatesWithRecords = (allRecords, fromDate, toDate) => {
        const datesSet = new Set();
        allRecords.forEach(r => {
            if (!r.date) return;
            const d = r.date.slice(0, 10);
            if (d >= fromDate && d <= toDate) datesSet.add(d);
        });
        return [...datesSet].sort();
    };

    const handlePrintReport = async () => {
        setLoading(true);
        
        // Add print CSS to control paper size
        const printCSS = `
<style>
@media print {
    @page {
        size: A4 landscape;
        margin: 0.5cm;
    }
    body {
        margin: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    table {
        page-break-inside: auto;
    }
    tr {
        page-break-inside: avoid;
        page-break-after: auto;
    }
    /* 🔥 FIX: Each new date starts on a fresh page */
    .rojmel-new-page {
        page-break-before: always !important;
        break-before: page !important;
    }
    .rojmel-date-separator {
        display: none;
    }
}
</style>`;
        // Special validation for aavak/javak
        if (report.type === "aavak" || report.type === "javak") {
            const mode = report.aavakMode || "month";
            if (mode === "month") {
                if (!report.selectedMonth) {
                    toast({ title: "મહિનો પસંદ કરો", status: "error", duration: 2000, position: "top" });
                    return;
                }
                if (!report.selectedYear_aavak) {
                    toast({ title: "વર્ષ પસંદ કરો", status: "error", duration: 2000, position: "top" });
                    return;
                }
            } else if (mode === "fullyear") {
                if (!report.aavakFullYear) {
                    toast({ title: "આ.વ. પસંદ કરો", status: "error", duration: 2000, position: "top" });
                    return;
                }
            } else if (mode === "custom") {
                if (!report.from || report.from.length !== 10) {
                    toast({ title: "From તારીખ પસંદ કરો", status: "error", duration: 2000, position: "top" });
                    return;
                }
                if (!report.to || report.to.length !== 10) {
                    toast({ title: "To તારીખ પસંદ કરો", status: "error", duration: 2000, position: "top" });
                    return;
                }
            }
        }
        // 🔥 Rojmel validation - all 3 modes
        else if (report.type === "rojmel") {
            const mode = report.rojmelMode || "month";
            if (mode === "month") {
                if (!report.rojmelMonth) {
                    toast({ title: "મહિનો પસંદ કરો", status: "error", duration: 2000, position: "top" });
                    return;
                }
                if (!report.rojmelYear) {
                    toast({ title: "વર્ષ પસંદ કરો", status: "error", duration: 2000, position: "top" });
                    return;
                }
            } else if (mode === "fullyear") {
                if (!report.rojmelFullYear) {
                    toast({ title: "આ.વ. પસંદ કરો", status: "error", duration: 2000, position: "top" });
                    return;
                }
            } else if (mode === "custom") {
                if (!report.from || report.from.length !== 10) {
                    toast({ title: "From તારીખ પસંદ કરો", status: "error", duration: 2000, position: "top" });
                    return;
                }
                if (!report.to || report.to.length !== 10) {
                    toast({ title: "To તારીખ પસંદ કરો", status: "error", duration: 2000, position: "top" });
                    return;
                }
            }
        }
        // Special validation for checkIssue
        else if (report.type === "checkIssue") {
            if (!report.checkType) {
                toast({ title: "ચેક પ્રકાર પસંદ કરો", status: "error", duration: 2000, position: "top" });
                return;
            }
            if (!report.selectedBank) {
                toast({ title: "બેંક પસંદ करो", status: "error", duration: 2000, position: "top" });
                return;
            }
            if (!report.selectedYear) {
                toast({ title: "આર્થિક વર્ષ પસંદ કરો", status: "error", duration: 2000, position: "top" });
                return;
            }
        }
        else if (!report.from || !report.to) {
            toast({ title: "તારીખ પસંદ કરો", status: "error", duration: 2000, position: "top" });
            return;
        }

        setLoading(true);

        try {
            let templateFile = "/aavak/aavak.html";
            if (report.type === "javak") templateFile = "/javak/javak.html";
            else if (report.type === "tarij") templateFile = "/tarij/tarij.html";
            else if (report.type === "checkIssue") templateFile = "/check-details/check-details.html";
            else if (report.type === "rojmel") templateFile = "/rojmel/rojmel.html";

            const fromDate = convertToISO(report.from);
            const toDate = convertToISO(report.to);

            const talukoName = user?.gam || "ગ્રામ પંચાયત";

            // ================================================================
            // 🔥 NEW ROJMEL: Generate one page per date that has entries
            // ================================================================
            if (report.type === "rojmel") {
                // First fetch all records in range to find which dates have entries
                const token = localStorage.getItem("token");
                const rangeRes = await fetch(`${apiBase}/cashmel/report?from=${fromDate}&to=${toDate}`, {
                    headers: { ...(token && { Authorization: `Bearer ${token}` }) }
                });
                const rangeJson = await rangeRes.json();
                const rangeRecords = Array.isArray(rangeJson.rows) ? rangeJson.rows : [];

                // Get unique dates that have records
                const datesWithRecords = getDatesWithRecords(rangeRecords, fromDate, toDate);

                if (datesWithRecords.length === 0) {
                    toast({
                        title: "કોઈ રેકોર્ડ નથી",
                        description: "પસંદ કરેલ સમય ગાળામાં કોઈ એન્ટ્રી નથી",
                        status: "warning",
                        duration: 2500,
                        position: "top",
                    });
                    setLoading(false);
                    return;
                }

                // Fetch records before the selected range to allow correct opening balance calculations
                const prevFromDate = new Date(fromDate);
                prevFromDate.setDate(prevFromDate.getDate() - 1);
                const prevToDate = prevFromDate.toISOString().slice(0, 10);
                const beforeRes = await fetch(`${apiBase}/cashmel/report?to=${prevToDate}`, {
                    headers: { ...(token && { Authorization: `Bearer ${token}` }) }
                });
                const beforeJson = await beforeRes.json();
                const beforeRecords = Array.isArray(beforeJson.rows) ? beforeJson.rows : [];

                const allRecords = [...beforeRecords, ...rangeRecords];

                // Generate HTML for each date (optimized: only 2 fetches total)
                const allPagesHTML = await generateRojmelPages(datesWithRecords, allRecords, templateFile, talukoName, fromDate);

                if (!allPagesHTML) {
                    toast({ title: "કોઈ રેકોર્ડ નથી", status: "warning", duration: 2000 });
                    setLoading(false);
                    return;
                }

          const win = window.open("", "_blank", "width=1400,height=900");
// ...
win.document.write(printCSS + allPagesHTML);
win.document.close();
// Give user option to Save As PDF from browser menu instead of print dialog
// Or add this line to auto-trigger:
setTimeout(() => {
    win.focus();
    win.print();
}, 1200); // ← increase delay to 1200ms so fonts load properly

                setLoading(false);
                return;
            }

            // CHECK ISSUE REPORT
            if (report.type === "checkIssue") {
                const qs = `?from=${fromDate}&to=${toDate}`;
                const url = `${apiBase}/cashmel/report${qs}`;
                const token = localStorage.getItem("token");
                const recordsRes = await fetch(url, {
                    headers: { ...(token && { Authorization: `Bearer ${token}` }) }
                });
                const resJson = await recordsRes.json();
                const allRecords = Array.isArray(resJson.rows) ? resJson.rows : [];

                const checkedRows = allRecords.filter(r =>
                    r.vyavharType === report.checkType &&
                    r.paymentMethod === "bank" &&
                    r.bank === report.selectedBank
                );

                if (checkedRows.length === 0) {
                    toast({ title: "ચેક ઈશ્યૂ રેકોર્ડ નથી", status: "warning" });
                    setLoading(false);
                    return;
                }

                let rowsHtml = "";
                checkedRows.forEach((r, i) => {
                    rowsHtml += `
<tr>
    <td>${guj(i + 1)}</td>
    <td>${Date_To_Gujarati(r.date?.slice(0, 10))}</td>
    <td>${r.ddCheckNum || ""}</td>
    <td class="text-right">${guj(r.amount || 0)}</td>
    <td>${r.receiptPaymentNo || ""}</td>
    <td>${r.name || ""}</td>
    <td>${r.remarks || ""}</td>
</tr>`;
                });

                const templateRes = await fetch(templateFile);
                if (!templateRes.ok) throw new Error("Template missing");
                let htmlTemplate = await templateRes.text();
                const fyGujarati = getGujaratiFinancialYear(fromDate);

                htmlTemplate = htmlTemplate
                    .replace("{{taluko}}", talukoName)
                    .replace("{{userTaluko}}", user?.taluko || "")
                    .replace("{{userJillo}}", user?.jillo || "")
                    .replace("{{bankName}}", report.selectedBank)
                    .replace("{{yearRange}}", fyGujarati)
                    .replace("{{dateRange}}", `${formatDateToGujarati(report.from)} થી ${formatDateToGujarati(report.to)}`)
                    .replace("{{rows}}", rowsHtml);

                const win = window.open("", "_blank", "width=900,height=700");
                setLoading(false);
                win.document.write(printCSS + htmlTemplate);
                win.document.close();
                setTimeout(() => { win.focus(); win.print(); }, 500);
                setLoading(false);
                return;
            }

            // ======================================================
            // AAVAK / JAVAK / TARIJ REPORTS
            // ======================================================
            const templateRes = await fetch(templateFile);
            if (!templateRes.ok) throw new Error("Template missing");
            let htmlTemplate = await templateRes.text();

            const fromDateObj = new Date(fromDate + "T00:00:00Z");

            const fyStartYear =
                fromDateObj.getMonth() + 1 < 4
                    ? fromDateObj.getFullYear() - 1
                    : fromDateObj.getFullYear();

            const yearStart = new Date(fyStartYear, 3, 1);
            const historicalFromDate = yearStart.toISOString().slice(0, 10);

            const historicalQs = report.type === "tarij"
                ? `?from=${historicalFromDate}&to=${toDate}`
                : `?vyavharType=${report.type}&from=${historicalFromDate}&to=${toDate}`;

            const historicalUrl = `${apiBase}/cashmel/report${historicalQs}`;
            const token = localStorage.getItem("token");
            const recordsRes = await fetch(historicalUrl, {
                headers: { ...(token && { Authorization: `Bearer ${token}` }) }
            });
            const resJson = await recordsRes.json();
            const allRecords = Array.isArray(resJson.rows) ? resJson.rows : [];

            const filteredRecords =
                report.type === "aavak" || report.type === "javak"
                    ? allRecords.filter(r => r.vyavharType === report.type)
                    : allRecords;

            const hasValidRecords = hasRecordsInRange(filteredRecords, fromDate, toDate);

            if (!hasValidRecords) {
                toast({
                    title: "કોઈ રેકોર્ડ નથી",
                    description: "પસંદ કરેલી તારીખ માટે કોઈ માહિતી ઉપલબ્ધ નથી",
                    status: "warning",
                    duration: 2500,
                    position: "top",
                });
                setLoading(false);
                return;
            }

            if (allRecords.length === 0) {
                toast({ title: "કોઈ રેકોર્ડ નથી", status: "warning", duration: 2000 });
                setLoading(false);
                return;
            }

            // TARIJ REPORT
            if (report.type === "tarij") {
                const fromDateObj = new Date(fromDate + "T00:00:00Z");
                const toDateObj = new Date(toDate + "T23:59:59Z");

                const selectedRecords = allRecords.filter(r => {
                    if (!r.date) return false;
                    const d = new Date(r.date);
                    if (isNaN(d.getTime())) return false;
                    return d >= fromDateObj && d <= toDateObj;
                });

                const aavakRecords = selectedRecords.filter(r => r.vyavharType === "aavak");
                const javakRecords = selectedRecords.filter(r => r.vyavharType === "javak");

                const aavakMap = {};
                const javakMap = {};

                aavakRecords.forEach(rec => {
                    // 🔥 FIX: Bank jama internal transfer exclude karo
                    if (rec.category === "બેંક જમા") return;
                    const cat = customCategories?.[rec.category] || rec.category;
                    aavakMap[cat] = (aavakMap[cat] || 0) + Number(rec.amount || 0);
                });
                javakRecords.forEach(rec => {
                    // 🔥 FIX: Bank jama internal transfer exclude karo
                    if (rec.category === "બેંક જમા") return;
                    const cat = customCategories?.[rec.category] || rec.category;
                    javakMap[cat] = (javakMap[cat] || 0) + Number(rec.amount || 0);
                });

                const aCats = Object.keys(aavakMap).sort();
                const jCats = Object.keys(javakMap).sort();
                const max = Math.max(aCats.length, jCats.length);

                let tableRows = "";
                let totalA = 0;
                let totalJ = 0;

                for (let i = 0; i < max; i++) {
                    const ac = aCats[i] || "";
                    const ja = jCats[i] || "";
                    const aAmt = aavakMap[ac] || 0;
                    const jAmt = javakMap[ja] || 0;
                    totalA += aAmt;
                    totalJ += jAmt;

                    tableRows += `
                <tr>
                    <td>${ac ? i + 1 : ""}</td>
                    <td>${ac}</td>
                    <td class="text-right">${guj(aAmt) || ""}</td>
                    <td>${ja ? i + 1 : ""}</td>
                    <td>${ja}</td>
                    <td class="text-right">${guj(jAmt) || ""}</td>
                </tr>`;
                }

                let openingBalance = 0;
                try {
                    const prevFrom = new Date(fromDate);
                    prevFrom.setFullYear(prevFrom.getFullYear() - 1);
                    const prevTo = new Date(toDate);
                    prevTo.setFullYear(prevTo.getFullYear() - 1);

                    const prevQs = `?from=${prevFrom.toISOString().slice(0,10)}&to=${prevTo.toISOString().slice(0,10)}`;
                    const prevRes = await fetch(`${apiBase}/cashmel/report${prevQs}`, {
                        headers: { ...(token && { Authorization: `Bearer ${token}` }) }
                    });
                    const prevJson = await prevRes.json();
                    const prevRows = Array.isArray(prevJson.rows) ? prevJson.rows : [];

                    let prevAavak = 0, prevJavak = 0;
                    prevRows.forEach(r => {
                        const amt = Number(r.amount || 0);
                        if (r.vyavharType === "aavak") prevAavak += amt;
                        if (r.vyavharType === "javak") prevJavak += amt;
                    });

                    const prevPrevFrom = new Date(prevFrom);
                    prevPrevFrom.setFullYear(prevPrevFrom.getFullYear() - 1);
                    const prevPrevTo = new Date(prevTo);
                    prevPrevTo.setFullYear(prevPrevTo.getFullYear() - 1);

                    const prevPrevRes = await fetch(`${apiBase}/cashmel/report?from=${prevPrevFrom.toISOString().slice(0,10)}&to=${prevPrevTo.toISOString().slice(0,10)}`, {
                        headers: { ...(token && { Authorization: `Bearer ${token}` }) }
                    });
                    const prevPrevJson = await prevPrevRes.json();
                    const prevPrevRows = Array.isArray(prevPrevJson.rows) ? prevPrevJson.rows : [];

                    let prevPrevAavak = 0, prevPrevJavak = 0;
                    prevPrevRows.forEach(r => {
                        const amt = Number(r.amount || 0);
                        if (r.vyavharType === "aavak") prevPrevAavak += amt;
                        if (r.vyavharType === "javak") prevPrevJavak += amt;
                    });

                    const prevYearOpening = prevPrevAavak - prevPrevJavak;
                    openingBalance = prevYearOpening + prevAavak - prevJavak;
                } catch {
                    openingBalance = 0;
                }

                const totalWithOpening = openingBalance + totalA;
                const closingBalance = totalWithOpening - totalJ;
                const fyGujarati = getGujaratiFinancialYear(fromDate);

                htmlTemplate = htmlTemplate
                    .replace("{{taluko}}", talukoName)
                    .replace("{{userTaluko}}", user?.taluko || "")
                    .replace("{{userJillo}}", user?.jillo || "")
                    .replace("{{yearRange}}", fyGujarati)
                    .replace("{{dateRange}}", `${formatDateToGujarati(report.from)} થી ${formatDateToGujarati(report.to)}`)
                    .replace("{{tableRows}}", tableRows)
                    .replace(/{{totalAavak}}/g, guj(totalA))
                    .replace(/{{totalJavak}}/g, guj(totalJ))
                    .replace(/{{grandTotal}}/g, guj(closingBalance))
                    .replace(/{{openingBalance}}/g, guj(openingBalance))
                    .replace(/{{totalWithOpening}}/g, guj(totalWithOpening))
                    .replace(/{{closingBalance}}/g, guj(closingBalance));

                const win = window.open("", "_blank", "width=1200,height=800");
                setLoading(false);
                win.document.write(printCSS + htmlTemplate);
                win.document.close();
                setTimeout(() => { win.focus(); win.print(); }, 500);
                setLoading(false);
                return;
            }

            // AAVAK / JAVAK MONTHLY REPORT
            // 🔥 FIX: For custom mode, only use records within the exact date range
            const isCustomMode = (report.type === "aavak" || report.type === "javak") && report.aavakMode === "custom";

            const records = allRecords.filter(r => {
                if (r.vyavharType !== report.type) return false;
                if (report.type === "javak" && r.category === "બેંક જમા") return false;
                // 🔥 FIX: Aavak report mein bhi bank jama entry exclude karo
                if (report.type === "aavak" && r.category === "બેંક જમા") return false;
                // 🔥 Custom mode: strictly filter by date range
                if (isCustomMode) {
                    if (!r.date) return false;
                    const d = r.date.slice(0, 10);
                    return d >= fromDate && d <= toDate;
                }
                return true;
            });
            const monthGroups = {};
            const allCategories = new Set();

            records.forEach(rec => {
                const catKey = rec.category;
                const cat = customCategories?.[catKey] || catKey;
                const amount = Number(rec.amount) || 0;
                if (!rec.date) return;
                const d = new Date(rec.date);
                if (isNaN(d)) return;

                // 🔥 Custom mode: only include days within selected range
                const recDateStr = rec.date.slice(0, 10);
                if (isCustomMode && (recDateStr < fromDate || recDateStr > toDate)) return;

                const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                const day = d.getDate();

                if (!monthGroups[monthKey]) {
                    monthGroups[monthKey] = {
                        categoriesMap: {},
                        dayTotals: Array(31).fill(0),
                        monthTotal: 0,
                    };
                }

                const mg = monthGroups[monthKey];
                if (!mg.categoriesMap[catKey]) {
                    mg.categoriesMap[catKey] = {
                        title: cat,
                        rowDays: Array(31).fill(0),
                        currentTotal: 0,
                    };
                }

                mg.categoriesMap[catKey].rowDays[day - 1] += amount;
                mg.categoriesMap[catKey].currentTotal += amount;
                mg.dayTotals[day - 1] += amount;
                mg.monthTotal += amount;
                allCategories.add(catKey);
            });

            const allSortedMonths = Object.keys(monthGroups).sort();
            const carryForward = {};
            const firstSelectedMonth = `${fromDateObj.getFullYear()}-${String(fromDateObj.getMonth() + 1).padStart(2, "0")}`;

            // 🔥 Custom mode: no carry forward needed (only selected range data exists)
            if (!isCustomMode) {
                allSortedMonths.forEach(monthKey => {
                    if (monthKey >= firstSelectedMonth) return;
                    const mg = monthGroups[monthKey];
                    allCategories.forEach(catKey => {
                        const entry = mg.categoriesMap[catKey];
                        const chaluMas = entry ? entry.currentTotal : 0;
                        const gatMas = carryForward[catKey] || 0;
                        carryForward[catKey] = chaluMas + gatMas;
                    });
                });
            }

            const toDateObj = new Date(toDate + "T00:00:00Z");
            const selectedMonths = allSortedMonths.filter(mk =>
                mk >= firstSelectedMonth &&
                mk <= `${toDateObj.getFullYear()}-${String(toDateObj.getMonth() + 1).padStart(2, "0")}`
            );

            const monthNameGuj = [
                "જાન્યુઆરી", "ફેબ્રુઆરી", "માર્ચ", "એપ્રિલ", "મે", "જૂન",
                "જુલાઈ", "ઓગસ્ટ", "સપ્ટેમ્બર", "ઓક્ટોબર", "નવેમ્બર", "ડિસેમ્બર"
            ];

            let allPagesHTML = "";

            selectedMonths.forEach((monthKey, mIdx) => {
                const mg = monthGroups[monthKey];
                const [year, m] = monthKey.split("-");
                const fyGujarati = getGujaratiFinancialYear(`${year}-${m}-01`);

                let pageHTML = htmlTemplate
                    .replace(/{{yearRange}}/g, fyGujarati)
                    .replace(/{{taluko}}/g, talukoName)
                    .replace(/{{userTaluko}}/g, user?.taluko || "")
                    .replace(/{{userJillo}}/g, user?.jillo || "");

                const monthName = monthNameGuj[parseInt(m) - 1];
                let tableRows = "";
                let idx = 1;
                let totalGatMas = 0;
                let totalKulRakam = 0;

                allCategories.forEach(catKey => {
                    const entry = mg.categoriesMap[catKey];
                    const title = entry?.title || customCategories?.[catKey] || catKey;
                    const chaluMas = entry ? entry.currentTotal : 0;
                    const gatMas = carryForward[catKey] || 0;
                    const kul = chaluMas + gatMas;

                    totalGatMas += gatMas;
                    totalKulRakam += kul;

                    const dayCells = entry
                        ? entry.rowDays.map(v => `<td>${guj(v)}</td>`).join("")
                        : Array(31).fill("<td>૦</td>").join("");

                    tableRows += `
                <tr>
                    <td>${idx}</td>
                    <td style="text-align:left">${title}</td>
                    ${dayCells}
                    <td>${guj(chaluMas)}</td>
                    <td>${guj(gatMas)}</td>
                    <td>${guj(kul)}</td>
                </tr>`;
                    idx++;
                    carryForward[catKey] = kul;
                });

                const totalDayCells = mg.dayTotals.map(v => `<td>${guj(v)}</td>`).join("");
                tableRows += `
            <tr style="font-weight:bold;background:#f7f7f7">
                <td colspan="2">એકાંકરે કુલ રકમ</td>
                ${totalDayCells}
                <td>${guj(mg.monthTotal)}</td>
                <td>${guj(totalGatMas)}</td>
                <td>${guj(totalKulRakam)}</td>
            </tr>`;

                // 🔥 Build labels
                // Title (1st h3): always shows overall selected range
                const overallRangeLabel = isCustomMode
                    ? `${formatDateToGujarati(report.from)} થી ${formatDateToGujarati(report.to)}`
                    : (selectedMonths.length === 1
                        ? `${monthName} ${guj(year)}`
                        : `${formatDateToGujarati(report.from)} થી ${formatDateToGujarati(report.to)}`);

                // Subtitle (3rd h3): always shows specific month of this page
                const monthLabel = `${monthName} ${guj(year)}`;

                // Replace: first occurrence = title (overall), second = subtitle (this month)
                let replaceCount = 0;
                pageHTML = pageHTML
                    .replace(/\{\{dateRange\}\}/g, () => {
                        replaceCount++;
                        return replaceCount === 1 ? overallRangeLabel : monthLabel;
                    })
                    .replace("{{tableRows}}", tableRows)
                    .replace("{{grandTotal}}", guj(mg.monthTotal));

                // 🔥 Fill {{monthBanner}} placeholder
                if (selectedMonths.length > 1 || isCustomMode) {
                    const bannerMonth = isCustomMode
                        ? `${formatDateToGujarati(report.from)} થી ${formatDateToGujarati(report.to)}`
                        : `${monthName} ${guj(year)} નો રિપોર્ટ (${mIdx + 1}/${selectedMonths.length})`;
                    const monthBanner = `
<div style="
  text-align:center;
  background:#1565c0;
  color:#fff;
  font-size:15px;
  font-weight:700;
  padding:8px 20px;
  margin-bottom:8px;
  border-radius:4px;
  -webkit-print-color-adjust:exact;
  print-color-adjust:exact;
">📅 ${bannerMonth}</div>`;
                    pageHTML = pageHTML.replace("{{monthBanner}}", monthBanner);
                } else {
                    pageHTML = pageHTML.replace("{{monthBanner}}", "");
                }

                allPagesHTML += pageHTML;
                if (mIdx < selectedMonths.length - 1) {
                    allPagesHTML += `<div style="page-break-after: always"></div>`;
                }
            });

            const win = window.open("", "_blank", "width=1200,height=800");
            setLoading(false);
            win.document.write(printCSS + allPagesHTML);
            win.document.close();
            setTimeout(() => { win.focus(); win.print(); }, 500);

        } catch (err) {
            console.error("Print error:", err);
            toast({
                title: "કૃપા કરીને યોગ્ય તારીખ પસંદ કરો",
                description: err.message || "કંઈક ખોટું થયું",
                status: "error",
                duration: 3000,
            });
        }

        setLoading(false);
    };

    return (
        <Box mt={4} p={3} bg="gray.50" rounded="md">
            <HStack spacing={3} mb={3} flexWrap="wrap">

                <Select
                    width="180px"
                    value={report.type}
                    onChange={(e) => handleReportChange("type", e.target.value)}
                >
                    <option value="aavak">આવક</option>
                    <option value="javak">જાવક</option>
                    <option value="checkIssue">ચેક ઈશ્યૂ</option>
                    <option value="tarij">તારીજ પત્રક</option>
                    <option value="rojmel">રોજમેળ</option>
                </Select>

                {/* FY Dropdown - tarij only */}
                {report.type === "tarij" && (
                    <Select
                        width="180px"
                        value={report.fy}
                        onChange={(e) => handleReportChange("fy", e.target.value)}
                        placeholder="આર્થિક વર્ષ પસંદ કરો"
                    >
                        {getFinancialYears().map((fy) => (
                            <option key={fy.value} value={fy.value}>{fy.label}</option>
                        ))}
                    </Select>
                )}

                {/* Bank and Year Dropdowns - checkIssue only */}
                {report.type === "checkIssue" && (
                    <>
                        <Select
                            width="160px"
                            value={report.checkType}
                            onChange={(e) => handleReportChange("checkType", e.target.value)}
                        >
                            <option value="javak">જાવક</option>
                            <option value="aavak">આવક</option>
                        </Select>

                        <Select
                            width="180px"
                            value={report.selectedBank}
                            onChange={(e) => handleReportChange("selectedBank", e.target.value)}
                            placeholder="બેંક પસંદ કરો"
                        >
                            {banks.map((bank) => (
                                <option key={bank._id} value={bank.name}>{bank.name}</option>
                            ))}
                        </Select>

                        <Select
                            width="180px"
                            value={report.selectedYear}
                            onChange={(e) => handleReportChange("selectedYear", e.target.value)}
                            placeholder="આર્થિક વર્ષ પસંદ કરો"
                        >
                            {getFinancialYears().map((fy) => (
                                <option key={fy.value} value={fy.value}>{fy.label}</option>
                            ))}
                        </Select>
                    </>
                )}

                {/* 🔥 Rojmel - Mode selector + inputs */}
                {report.type === "rojmel" && (
                    <>
                        {/* Mode selector dropdown */}
                        <Select
                            width="160px"
                            value={report.rojmelMode || "month"}
                            onChange={(e) => handleReportChange("rojmelMode", e.target.value)}
                        >
                            <option value="month">મહિનો / વર્ષ</option>
                            <option value="fullyear">આખું આ.વ.</option>
                            <option value="custom">કસ્ટમ તારીખ</option>
                        </Select>

                        {/* Month + Year mode */}
                        {(!report.rojmelMode || report.rojmelMode === "month") && (
                            <>
                                <Select
                                    width="150px"
                                    value={report.rojmelMonth}
                                    onChange={(e) => handleReportChange("rojmelMonth", e.target.value)}
                                >
                                    <option value="">મહિનો પસંદ કરો</option>
                                    {getMonths().map((month) => (
                                        <option key={month.value} value={month.value}>{month.label}</option>
                                    ))}
                                </Select>
                                <Select
                                    width="120px"
                                    value={report.rojmelYear}
                                    onChange={(e) => handleReportChange("rojmelYear", e.target.value)}
                                >
                                    <option value="">વર્ષ પસંદ કરો</option>
                                    {getYearsForMonthly().map((year) => (
                                        <option key={year.value} value={year.value}>{year.label}</option>
                                    ))}
                                </Select>
                            </>
                        )}

                        {/* Full Financial Year mode */}
                        {report.rojmelMode === "fullyear" && (
                            <Select
                                width="180px"
                                value={report.rojmelFullYear}
                                onChange={(e) => handleReportChange("rojmelFullYear", e.target.value)}
                                placeholder="આ.વ. પસંદ કરો"
                            >
                                {getFinancialYears().map((fy) => (
                                    <option key={fy.value} value={fy.value}>{fy.label}</option>
                                ))}
                            </Select>
                        )}

                        {/* Custom Date Range mode */}
                        {report.rojmelMode === "custom" && (
                            <>
                                <DateInput
                                    label="From"
                                    name="from"
                                    value={report.from}
                                    onDateChange={handleReportChange}
                                    formatDisplayDate={formatDisplayDate}
                                    convertToISO={convertToISO}
                                />
                                <DateInput
                                    label="To"
                                    name="to"
                                    value={report.to}
                                    onDateChange={handleReportChange}
                                    formatDisplayDate={formatDisplayDate}
                                    convertToISO={convertToISO}
                                />
                            </>
                        )}
                    </>
                )}

                {/* Aavak / Javak: Mode selector + inputs */}
                {(report.type === "aavak" || report.type === "javak") && (
                    <>
                        {/* Mode selector */}
                        <Select
                            width="160px"
                            value={report.aavakMode || "month"}
                            onChange={(e) => handleReportChange("aavakMode", e.target.value)}
                        >
                            <option value="month">મહિનો / વર્ષ</option>
                            <option value="fullyear">આખું આ.વ.</option>
                            {/* <option value="custom">કસ્ટમ તારીખ</option> */}
                        </Select>

                        {/* Month + Year mode */}
                        {(!report.aavakMode || report.aavakMode === "month") && (
                            <>
                                <Select
                                    width="150px"
                                    value={report.selectedMonth}
                                    onChange={(e) => handleReportChange("selectedMonth", e.target.value)}
                                >
                                    <option value="">મહિનો પસંદ કરો</option>
                                    {getMonths().map((month) => (
                                        <option key={month.value} value={month.value}>{month.label}</option>
                                    ))}
                                </Select>
                                <Select
                                    width="120px"
                                    value={report.selectedYear_aavak}
                                    onChange={(e) => handleReportChange("selectedYear_aavak", e.target.value)}
                                >
                                    <option value="">વર્ષ પસંદ કરો</option>
                                    {getYearsForMonthly().map((year) => (
                                        <option key={year.value} value={year.value}>{year.label}</option>
                                    ))}
                                </Select>
                            </>
                        )}

                        {/* Full Financial Year mode */}
                        {report.aavakMode === "fullyear" && (
                            <Select
                                width="180px"
                                value={report.aavakFullYear}
                                onChange={(e) => handleReportChange("aavakFullYear", e.target.value)}
                                placeholder="આ.વ. પસંદ કરો"
                            >
                                {getFinancialYears().map((fy) => (
                                    <option key={fy.value} value={fy.value}>{fy.label}</option>
                                ))}
                            </Select>
                        )}

                        {/* Custom Date Range mode */}
                        {report.aavakMode === "custom" && (
                            <>
                                <DateInput
                                    label="From"
                                    name="from"
                                    value={report.from}
                                    onDateChange={handleReportChange}
                                    formatDisplayDate={formatDisplayDate}
                                    convertToISO={convertToISO}
                                />
                                <DateInput
                                    label="To"
                                    name="to"
                                    value={report.to}
                                    onDateChange={handleReportChange}
                                    formatDisplayDate={formatDisplayDate}
                                    convertToISO={convertToISO}
                                />
                            </>
                        )}
                    </>
                )}

                {/* Other report types - date inputs (if not tarij/checkIssue/rojmel/aavak/javak) */}
                {report.type !== "tarij" && report.type !== "rojmel" &&
                    report.type !== "checkIssue" && report.type !== "aavak" && report.type !== "javak" && (
                        <>
                            <DateInput
                                label="From "
                                name="from"
                                value={report.from}
                                onDateChange={handleReportChange}
                                formatDisplayDate={formatDisplayDate}
                                convertToISO={convertToISO}
                            />
                            <DateInput
                                label="To "
                                name="to"
                                value={report.to}
                                onDateChange={handleReportChange}
                                formatDisplayDate={formatDisplayDate}
                                convertToISO={convertToISO}
                            />
                        </>
                    )}

                <Button
                    colorScheme="green"
                    isLoading={loading}
                    onClick={handlePrintReport}
                    leftIcon={<Icon as={FiPrinter} />}
                >
                    પ્રિન્ટ / PDF
                </Button>
            </HStack>
        </Box>
    );
};

export default CashMelReport;