import {
  HStack,
  Button,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  VStack,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  CustomButton,
  CustomFormLabel,
  CustomHeading,
  CustomSelect,
} from "component-library-iboon";
import { FaLanguage, FaSignOutAlt, FaUser } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import { useUser } from "../../ports/context/UserContext";
import { useLanguage } from "../../ports/context/LanguageContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FaGear } from "react-icons/fa6";
import { fetchVillagesPage } from "../../adapters/VillageApiAdapter";
import { useVillage } from "../../ports/context/VillageContext";
import MasterModal from "./MasterModal";
import { fetchFinancialYearsPage } from "../../adapters/FinancialYearApiAdapter";
import { useFinancialYear } from "../../ports/context/FinancialYearContext";
import { fetchDistrictsPage } from "../../adapters/DistrictApiAdapter";
import { fetchTalukasPage } from "../../adapters/TalukaApiAdapter";
import { convertEngToGujNumber } from "../../utils/convertEngToGujNumber";

export default function Topbar() {
  const { t } = useTranslation();
  const { user } = useUser();
  // console.log("user", user);
// console.log(user?.role.permissions);

  const { language, changeLanguage } = useLanguage();
  const {
    village,
    updateVillage,
    updateDistrict,
    district,
    updateTaluka,
    taluka,
    talukaName,
  } = useVillage();
  const { financialYear, updateFinancialYear } = useFinancialYear();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [openModal, setOpenModal] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [villages, setVillages] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const navigate = useNavigate();
  const cancelRef = useRef(null);

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  const menuItems = [
    {
      label: t("topbar.dashboard"),
      path: "/",
    },
    {
      label: t("topbar.masters"),
      children: [
        ...(user?.role.permissions.includes("DISTRICTS_READ")
          ? [{ label: t("topbar.districts"), path: "/districts" }]
          : []),
        ...(user?.role.permissions.includes("TALUKAS_READ")
          ? [{ label: t("topbar.talukas"), path: "/talukas" }]
          : []),
        ...(user?.role.permissions.includes("VILLAGES_READ")
          ? [{ label: t("topbar.villages"), path: "/villages" }]
          : []),
        ...(user?.role.permissions.includes("VILLAGERS_READ")
          ? [{ label: t("topbar.villagers"), path: "/villagers" }]
          : []),
        ...(user?.role.permissions.includes("MAIN_REPORT_READ")
          ? [{ label: t("topbar.mainReport"), path: "/main-report" }]
          : []),
          
        ...(user?.role.permissions.includes("DATE_IMPORT_READ")
          ? [{ label: t("topbar.importData"), path: "/import-data" }]
          : []),
      ],
    },

    ...(village && financialYear
      ? [
          {
            label: t("topbar.landRevenue"),
            children: [
              ...(user?.role.permissions.includes("LAND_MANGANU_READ")
                ? [{ label: t("topbar.mangnu"), path: "/land-revenue-maangnu" }]
                : []),
              ...(user?.role.permissions.includes("LAND_REVENUE_READ")
                ? [
                    {
                      label: t("topbar.collection"),
                      path: "/land-revenue-collection",
                    },
                  ]
                : []),

              ...(user?.role.permissions.includes("LAND_REPORT_READ")
                ? [{ label: t("topbar.report"), path: "/land-revenue-report" }]
                : []),
              ...(user?.role.permissions.includes("CHALLAN_READ")
                ? [
                    {
                      label: t("topbar.challan"),
                      path: "/land-revenue-challan",
                    },
                  ]
                : []),
            ],
          },
          ...(!["માણસા", "વિજાપુર"].includes(talukaName.trim())
            ? [
                {
                  label: t("topbar.localFund"),
                  children: [
                    ...(user?.role.permissions.includes("LOCAL_MANGANU_READ")
                      ? [
                          {
                            label: t("topbar.mangnu"),
                            path: "/local-fund-maangnu",
                          },
                        ]
                      : []),
                    ...(user?.role.permissions.includes(
                      "LOCAL_FUND_REVENUE_READ"
                    )
                      ? [
                          {
                            label: t("topbar.collection"),
                            path: "/local-fund-collection",
                          },
                        ]
                      : []),
                    ...(user?.role.permissions.includes("LOCAL_REPORT_READ")
                      ? [
                          {
                            label: t("topbar.report"),
                            path: "/local-fund-report",
                          },
                        ]
                      : []),
                    ...(user?.role.permissions.includes("CHALLAN_READ")
                      ? [
                          {
                            label: t("topbar.challan"),
                            path: "/local-fund-challan",
                          },
                        ]
                      : []),
                  ],
                },
              ]
            : []),
          {
            label: t("topbar.educationCess"),
            children: [
              ...(user?.role.permissions.includes("EDUCATION_MANGANU_READ")
                ? [
                    {
                      label: t("topbar.mangnu"),
                      path: "/education-cess-maangnu",
                    },
                  ]
                : []),
              ...(user?.role.permissions.includes("EDUCATION_REVENUE_READ")
                ? [
                    {
                      label: t("topbar.collection"),
                      path: "/education-cess-collection",
                    },
                  ]
                : []),
              ...(user?.role.permissions.includes("EDUCATION_REPORT_READ")
                ? [
                    {
                      label: t("topbar.report"),
                      path: "/education-cess-report",
                    },
                  ]
                : []),
              ...(user?.role.permissions.includes("CHALLAN_READ")
                ? [
                    {
                      label: t("topbar.challan"),
                      path: "/education-cess-challan",
                    },
                  ]
                : []),
            ],
          },
        ]
      : []),

    ...(user?.role?.name === "Super Admin"
      ? [
          {
            label: t("topbar.settings"),
            children: [
              { label: t("topbar.users"), path: "/users" },
              { label: t("topbar.roles"), path: "/roles" },
              { label: t("topbar.permissions"), path: "/permissions" },
            ],
          },
        ]
      : []),
  ];

  const renderMenuItem = (item) => {
    if (item.children) {
      return (
        <Popover trigger="hover" placement="bottom-start" key={item.label}>
          <PopoverTrigger>
            <Button
              variant="ghost"
              color="white"
              _hover={{ bg: "teal.600" }}
              rightIcon={<ChevronDownIcon />}
            >
              {item.label}
            </Button>
          </PopoverTrigger>
          <PopoverContent w="150px">
            <PopoverBody p={2}>
              <VStack align="start" spacing={1}>
                {item.children.map((child) => (
                  <Button
                    key={child.path}
                    variant="ghost"
                    justifyContent="flex-start"
                    w="100%"
                    onClick={() => navigate(child.path)}
                  >
                    {child.label}
                  </Button>
                ))}
              </VStack>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      );
    } else {
      return (
        <Button
          key={item.label}
          variant="ghost"
          color="white"
          _hover={{ bg: "teal.600" }}
          onClick={() => navigate(item.path)}
        >
          {item.label}
        </Button>
      );
    }
  };

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const response = await fetchDistrictsPage(1, 1000, "", "", {}, 1);
        const list = response?.data?.data || response?.data || [];
        setDistricts(list);
      } catch (error) {
        console.error("Error fetching districts:", error);
        setDistricts([]);
      }
    };

    fetchDistricts();
  }, [user?._id]);

  useEffect(() => {
    const fetchTalukas = async () => {
      try {
        const response = await fetchTalukasPage(
          1,
          1000,
          "",
          { district },
          1,
          ""
        );
        const list = response?.data?.data || response?.data || [];
        setTalukas(list);
      } catch (error) {
        console.error("Error fetching talukas:", error);
        setTalukas([]);
      }
    };
    if (district) {
      fetchTalukas();
    } else {
      setTalukas([]);
    }
  }, [district, user?._id]);

  useEffect(() => {
    const fetchVillages = async () => {
      try {
        const response = await fetchVillagesPage(
          1,
          1000,
          "",
          "",
          // user.role.name === "Super Admin"
          //   ? {}
          //   : { _id: { $in: user?.villageAccess || [] } },
          {
            taluka,
            // ,
            // ...(user?.role?.name === "Super Admin"
            //   ? {}
            //   : { _id: { $in: user?.villageAccess || [] } }),
          },
          1
        );
        const list = response?.data?.data || response?.data || [];
        setVillages(list);
      } catch (error) {
        console.error("Error fetching villages:", error);
        setVillages([]);
      }
    };

    const fetchFinancialYears = async () => {
      try {
        const response = await fetchFinancialYearsPage();
        const list = response?.data?.data || response?.data || [];
        setFinancialYears(list);
      } catch (error) {
        console.error("Error fetching financial years:", error);
        setFinancialYears([]);
      }
    };

    if (user && user._id) {
      if (taluka) {
        fetchVillages();
      } else {
        setVillages([]);
      }
      fetchFinancialYears();
    }
  }, [user, taluka]);

  const closeModal = () => {
    setOpenModal(false);
  };

  return (
    <>
      <HStack
        w="100%"
        h="50px"
        justifyContent="space-between"
        px={5}
        bgColor="teal"
        color="white"
      >
        <HStack spacing={3} alignItems="center" w={"90%"}>
          <CustomHeading as="h1">{t("topbar.title")}</CustomHeading>

          <HStack spacing={3}>{menuItems.map(renderMenuItem)}</HStack>

          <CustomSelect
            maxW={"200px"}
            value={district}
            onChange={(e) =>
              updateDistrict(
                e.target.value,
                e.target.selectedOptions[0].getAttribute("name")
              )
            }
            color={"white"}
          >
            <option value={""} style={{ color: "gray" }}>
              {t("topbar.selectDistrict")}
            </option>
            {districts?.map((v) => (
              <option
                key={v._id}
                name={v.name}
                value={v._id}
                style={{ color: "black" }}
              >
                {v.name}
              </option>
            ))}
          </CustomSelect>
          <CustomSelect
            maxW={"200px"}
            value={taluka}
            onChange={(e) =>
              updateTaluka(
                e.target.value,
                e.target.selectedOptions[0].getAttribute("name")
              )
            }
            color={"white"}
          >
            <option value={""} style={{ color: "gray" }}>
              {t("topbar.selectTaluka")}
            </option>
            {talukas?.map((v) => (
              <option
                key={v._id}
                name={v.name}
                value={v._id}
                style={{ color: "black" }}
              >
                {v.name}
              </option>
            ))}
          </CustomSelect>

          <CustomSelect
            maxW={"200px"}
            value={village}
            onChange={(e) =>
              updateVillage(
                e.target.value,
                e.target.selectedOptions[0].getAttribute("name")
              )
            }
            color={"white"}
          >
            <option value={""} style={{ color: "gray" }}>
              {t("topbar.selectVillage")}
            </option>
            {villages?.map((v) => (
              <option
                key={v._id}
                name={v.name}
                value={v._id}
                style={{ color: "black" }}
              >
                {v.name}
              </option>
            ))}
          </CustomSelect>

          <CustomSelect
            maxW={"200px"}
            value={financialYear}
            onChange={(e) =>
              updateFinancialYear(
                e.target.value,
                e.target.selectedOptions[0].getAttribute("name")
              )
            }
            color={"white"}
          >
            <option value={""} style={{ color: "gray" }}>
              {t("topbar.selectFinancialYear")}
            </option>
            {financialYears?.map((v) => (
              <option
                key={v._id}
                name={v.year}
                value={v._id}
                style={{ color: "black" }}
              >
                {convertEngToGujNumber(v.year)}
              </option>
            ))}
          </CustomSelect>

          {/* <CustomFormLabel mb={0} color={"white"}>
            2025-2026
          </CustomFormLabel> */}
        </HStack>

        <Popover trigger="hover" placement="bottom-end">
          <PopoverTrigger>
            <CustomButton designType="menu" rightIcon={<ChevronDownIcon />}>
              {t("topbar.hello", { name: user?.name })}
            </CustomButton>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverBody p={2}>
              <VStack align="start" spacing={1}>
                <Button
                  variant="ghost"
                  justifyContent="flex-start"
                  w="100%"
                  onClick={() => navigate("/profile")}
                  leftIcon={<FaUser />}
                >
                  {t("topbar.myProfile")}
                </Button>
                {user?.role.permissions.includes("MASTER_READ") && (
                  <Button
                    variant="ghost"
                    justifyContent="flex-start"
                    w="100%"
                    onClick={() => setOpenModal(true)}
                    leftIcon={<FaUser />}
                  >
                    {t("topbar.master")}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  justifyContent="flex-start"
                  w="100%"
                  leftIcon={<FaGear />}
                >
                  {t("topbar.settings")}
                </Button>
                <Button
                  variant="ghost"
                  justifyContent="flex-start"
                  w="100%"
                  onClick={() =>
                    changeLanguage(language === "en" ? "gj" : "en")
                  }
                  leftIcon={<FaLanguage />}
                >
                  {t("topbar.changeLanguage", {
                    language: language === "en" ? "Hindi" : "English",
                  })}
                </Button>
                <Button
                  variant="ghost"
                  justifyContent="flex-start"
                  w="100%"
                  color="red"
                  onClick={onOpen}
                  leftIcon={<FaSignOutAlt />}
                >
                  {t("topbar.logout")}
                </Button>
              </VStack>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </HStack>

      {/* Logout Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>
              {t("topbar.logoutConfirmTitle") || "Confirm Logout"}
            </AlertDialogHeader>
            <AlertDialogBody>
              {t("topbar.logoutConfirmBody") ||
                "Are you sure you want to logout?"}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                {t("common.cancel") || "Cancel"}
              </Button>
              <Button colorScheme="red" onClick={handleLogout} ml={3}>
                {t("topbar.logout") || "Logout"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <MasterModal isOpen={openModal} onClose={closeModal} />
    </>
  );
}
