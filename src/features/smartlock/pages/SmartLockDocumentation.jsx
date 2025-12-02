import { IoDocumentTextSharp } from "react-icons/io5";
import { FaExternalLinkAlt } from "react-icons/fa";

import { useState } from "react";
export default function SmartLockDocumentationPage() {
  const [selectedPDF, setSelectedPDF] = useState("");
  const [documents] = useState([
    {
      section: "Documents",
      subSection: "OpenNet",
      name: "Edge Router Data Sheet",
      url: "https://appriver3651001439.sharepoint.com/sites/projectmanagementoffice/_layouts/15/embed.aspx?UniqueId=8b0e7949-2ad0-45a2-b063-a9f11db5d5e7",
      updatedOn: "2025-3-19",
    },
    {
      section: "Documents",
      subSection: "OpenNet",
      name: "Edge Router Enclosure Diagram",
      url: "https://appriver3651001439.sharepoint.com/sites/projectmanagementoffice/_layouts/15/embed.aspx?UniqueId=74e7671a-e30e-4bf8-8665-99cb9da26eff",
      updatedOn: "2025-3-19",
    },
    {
      section: "Documents",
      subSection: "OpenNet",
      name: "Edge Router & Access Point Info Dump",
      url: "https://appriver3651001439.sharepoint.com/sites/projectmanagementoffice/_layouts/15/Doc.aspx?sourcedoc={4bc7b7f1-1229-45c0-83e6-7e7faff5027e}&action=embedview",
      updatedOn: "2025-3-19",
    },
    {
      section: "Documents",
      subSection: "General",
      name: "Firmware details - 1.9.0",
      url: "https://appriver3651001439.sharepoint.com/sites/projectmanagementoffice/_layouts/15/embed.aspx?UniqueId=04b60261-90dc-4af2-a4e3-2b526cf34d01",
      updatedOn: "2025-3-19",
    },
    {
      section: "Documents",
      subSection: "SmartLock",
      name: "How to service a SmartLock Battery",
      url: "https://appriver3651001439.sharepoint.com/sites/projectmanagementoffice/_layouts/15/Doc.aspx?sourcedoc={366ff1be-2c81-46c7-8466-8a4a2ca4e63e}&action=embedview",
      updatedOn: "2025-3-19",
    },
    {
      section: "Documents",
      subSection: "General",
      name: "Troubleshooting Guide",
      url: "https://appriver3651001439.sharepoint.com/sites/projectmanagementoffice/_layouts/15/Doc.aspx?sourcedoc={9dcd12fb-2549-4ff9-96ad-3cbf27bb25a0}&action=embedview",
      updatedOn: "2025-3-19",
    },
    {
      section: "Documents",
      subSection: "General",
      name: "Training Presentation - Day 1",
      url: "https://appriver3651001439.sharepoint.com/sites/projectmanagementoffice/_layouts/15/Doc.aspx?sourcedoc={94c30ae6-4b62-46b3-9baf-5672fc5723cf}&action=embedview&wdAr=1.7766666666666666",
      updatedOn: "2025-3-19",
    },
    {
      section: "Documents",
      subSection: "General",
      name: "Training Presentation - Day 2",
      url: "https://appriver3651001439.sharepoint.com/sites/projectmanagementoffice/_layouts/15/Doc.aspx?sourcedoc={c16e5b12-edcd-45c4-a961-087e9e7546a8}&action=embedview&wdAr=1.7766666666666666",
      updatedOn: "2025-3-19",
    },
    {
      section: "Documents",
      subSection: "SmartLock",
      name: "SmartLock Info Dump",
      url: "https://appriver3651001439.sharepoint.com/sites/projectmanagementoffice/_layouts/15/Doc.aspx?sourcedoc={ef74b2df-1eff-4cf0-9139-5b3aac2ed0cf}&action=embedview",
      updatedOn: "2025-3-19",
    },
    {
      section: "Documents",
      subSection: "General",
      name: "Pairing Equipment",
      url: "https://appriver3651001439.sharepoint.com/sites/projectmanagementoffice/_layouts/15/Doc.aspx?sourcedoc={e838d0ac-372f-47a6-b8b8-76ba6bf29dd6}&action=embedview",
      updatedOn: "2025-3-19",
    },
    {
      section: "Customer Facing Documents",
      subSection: "SmartLock",
      name: "INSOMNIAC SmartLock S Installation Manual",
      url: "https://appriver3651001439.sharepoint.com/sites/projectmanagementoffice/_layouts/15/embed.aspx?UniqueId=0304f826-ba75-4cdf-b013-a35d445a9c96",
      updatedOn: "2025-3-19",
    },
    {
      section: "Customer Facing Documents",
      subSection: "SmartLock",
      name: "INSOMNIAC SmartLock R & O Installation Manual",
      url: "https://appriver3651001439.sharepoint.com/sites/projectmanagementoffice/_layouts/15/embed.aspx?UniqueId=87c01cbc-18ec-4f3e-80f7-11f220165d2c",
      updatedOn: "2025-3-19",
    },
    {
      section: "Documents",
      subSection: "General",
      name: "Import Tool",
      url: "https://appriver3651001439.sharepoint.com/sites/projectmanagementoffice/_layouts/15/Doc.aspx?sourcedoc={b47cbf24-c8d1-4ce0-bdb5-9ab5e983c0bc}&action=embedview",
      updatedOn: "2025-3-19",
    },
    {
      section: "Customer Facing Documents",
      subSection: "OpenNet",
      name: "OpenNet Edge Router & Access Point Installation Manual",
      url: "https://appriver3651001439.sharepoint.com/sites/projectmanagementoffice/_layouts/15/embed.aspx?UniqueId=cf4a81fa-0598-4a42-9b05-330cb6048d8e",
      updatedOn: "2025-3-19",
    },
    {
      section: "Customer Facing Documents",
      subSection: "SmartLock",
      name: "INSOMNIAC SmartLock S Operation Guide",
      url: "https://appriver3651001439.sharepoint.com/sites/projectmanagementoffice/_layouts/15/Doc.aspx?sourcedoc={d6baee0e-ca73-4944-8309-8fdfd6367138}&action=embedview",
      updatedOn: "2025-3-19",
    },
    {
      section: "Customer Facing Documents",
      subSection: "SmartLock",
      name: "INSOMNIAC SmartLock S Troubleshooting Guide",
      url: "https://appriver3651001439.sharepoint.com/sites/projectmanagementoffice/_layouts/15/embed.aspx?UniqueId=7ebfe0c7-350b-4554-b1ac-6a05d02717c4",
      updatedOn: "2025-3-19",
    },
    {
      section: "Customer Facing Documents",
      subSection: "SmartLock",
      name: "INSOMNIAC SmartLock R Troubleshooting Guide",
      url: "https://appriver3651001439.sharepoint.com/sites/projectmanagementoffice/_layouts/15/embed.aspx?UniqueId=b590fa19-3162-4705-8ae0-057149304d7f",
      updatedOn: "2025-3-19",
    },
    {
      section: "Customer Facing Documents",
      subSection: "SmartLock",
      name: "INSOMNIAC SmartLock O Troubleshooting Guide",
      url: "https://appriver3651001439.sharepoint.com/sites/projectmanagementoffice/_layouts/15/embed.aspx?UniqueId=4abc6000-f32a-4209-84fa-8c8d78f82681",
      updatedOn: "2025-3-19",
    },
    {
      section: "Documents",
      subSection: "General",
      name: "Onboarding SmartLock",
      url: "https://appriver3651001439.sharepoint.com/sites/projectmanagementoffice/_layouts/15/Doc.aspx?sourcedoc={723cdebf-7af7-492b-a34d-abef18cc8691}&action=embedview",
      updatedOn: "2025-3-19",
    },
    {
      section: "Documents",
      subSection: "OpenNet",
      name: "Edge Router & Access Point Placement Guide",
      url: "https://appriver3651001439.sharepoint.com/sites/projectmanagementoffice/_layouts/15/Doc.aspx?sourcedoc={b2a699b3-ae87-4806-a742-750d4295e820}&action=embedview",
      updatedOn: "2025-3-19",
    },
  ]);
  return (
    <div className="relative overflow-auto h-full dark:text-white dark:bg-darkPrimary">
      {selectedPDF && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          {/* Modal Container */}
          <div className="bg-white rounded-sm shadow-lg dark:bg-darkPrimary w-3/4 h-6/7">
            <div className="pl-5 border-b-2 border-b-yellow-500 flex h-10 items-center relative">
              <div className="flex text-center items-center">
                <IoDocumentTextSharp />
                <h2 className="ml-2 text-lg font-bold text-center items-center">
                  {selectedPDF.name}
                </h2>
                <FaExternalLinkAlt
                  className="ml-2 text-xs hover:cursor-pointer"
                  title={selectedPDF.url}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(selectedPDF.url, "_blank");
                  }}
                />
              </div>
              <p className="text-xs">{selectedPDF.updatedOn}</p>
              <button
                className="ml-auto text-zinc-600 hover:cursor-pointer bg-zinc-100 hover:bg-zinc-300 dark:text-white dark:hover:bg-red-500 h-full px-5 rounded-tr dark:bg-zinc-800"
                onClick={() => setSelectedPDF("")}
              >
                x
              </button>
            </div>
            <iframe
              src={selectedPDF.url}
              title="PDF Viewer"
              className="w-full h-full focus:outline-none rounded-b"
            ></iframe>
          </div>
        </div>
      )}
      <div className="flex h-12 bg-zinc-200 items-center dark:border-border dark:bg-darkNavPrimary">
        <div className="ml-5 flex items-center text-sm">
          <IoDocumentTextSharp className="text-lg" />
          &ensp; Documentation
        </div>
      </div>
      <div className="w-full px-5 flex flex-col rounded-lg">
        <div className="mt-5">
          <h1 className="text-3xl font-semibold">SmartLock Documentation</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-300">
            Welcome to the SmartLock documentation. Here you will find all the
            information you need to get started with SmartLock.
          </p>
        </div>
        <div className="mt-5">
          <h2 className="text-2xl font-semibold">Getting Started</h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-300">
            To get started with SmartLock, you will need an Insmoniac Control
            Center account. Once you have an account, you can log in and start
            using SmartLock.
          </p>
        </div>
        <div className="mt-5">
          <h2 className="text-2xl font-semibold">Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* General Section */}
            <div className="p-4">
              <h2 className="font-bold text-lg mb-2 text-center">General</h2>
              <ul className="list-disc list-inside space-y-2 max-h-48 overflow-y-auto">
                {documents
                  .filter(
                    (doc) =>
                      doc.section === "Documents" &&
                      doc.subSection === "General"
                  )
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((document, index) => (
                    <li
                      key={index}
                      className="hover:text-blue-500 cursor-pointer"
                      onClick={() => setSelectedPDF(document)}
                    >
                      {document.name}
                    </li>
                  ))}
              </ul>
            </div>
            {/* SmartLock Section */}
            <div className="p-4">
              <h2 className="font-bold text-lg mb-2 text-center">SmartLock</h2>
              <ul className="list-disc list-inside space-y-2 max-h-48 overflow-y-auto">
                {documents
                  .filter(
                    (doc) =>
                      doc.section === "Documents" &&
                      doc.subSection === "SmartLock"
                  )
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((document, index) => (
                    <li
                      key={index}
                      className="hover:text-blue-500 cursor-pointer"
                      onClick={() => setSelectedPDF(document)}
                    >
                      {document.name}
                    </li>
                  ))}
              </ul>
            </div>
            {/* OpenNet Section */}
            <div className="p-4">
              <h2 className="font-bold text-lg mb-2 text-center">OpenNet</h2>
              <ul className="list-disc list-inside space-y-2 max-h-48 overflow-y-auto">
                {documents
                  .filter(
                    (doc) =>
                      doc.section === "Documents" &&
                      doc.subSection === "OpenNet"
                  )
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((document, index) => (
                    <li
                      key={index}
                      className="hover:text-blue-500 cursor-pointer"
                      onClick={() => setSelectedPDF(document)}
                    >
                      {document.name}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
          <h2 className="text-2xl font-semibold">Customer Facing Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* General Section */}
            <div className="p-4">
              <h2 className="font-bold text-lg mb-2 text-center">General</h2>
              <ul className="list-disc list-inside space-y-2 max-h-48 overflow-y-auto">
                {documents
                  .filter(
                    (doc) =>
                      doc.section === "Customer Facing Documents" &&
                      doc.subSection === "General"
                  )
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((document, index) => (
                    <li
                      key={index}
                      className="hover:text-blue-500 cursor-pointer"
                      onClick={() => setSelectedPDF(document)}
                    >
                      {document.name}
                    </li>
                  ))}
              </ul>
            </div>
            {/* SmartLock Section */}
            <div className="p-4">
              <h2 className="font-bold text-lg mb-2 text-center">SmartLock</h2>
              <ul className="list-disc list-inside space-y-2 max-h-48 overflow-y-auto">
                {documents
                  .filter(
                    (doc) =>
                      doc.section === "Customer Facing Documents" &&
                      doc.subSection === "SmartLock"
                  )
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((document, index) => (
                    <li
                      key={index}
                      className="hover:text-blue-500 cursor-pointer"
                      onClick={() => setSelectedPDF(document)}
                    >
                      {document.name}
                    </li>
                  ))}
              </ul>
            </div>
            {/* OpenNet Section */}
            <div className="p-4">
              <h2 className="font-bold text-lg mb-2 text-center">OpenNet</h2>
              <ul className="list-disc list-inside space-y-2 max-h-48 overflow-y-auto">
                {documents
                  .filter(
                    (doc) =>
                      doc.section === "Customer Facing Documents" &&
                      doc.subSection === "OpenNet"
                  )
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((document, index) => (
                    <li
                      key={index}
                      className="hover:text-blue-500 cursor-pointer"
                      onClick={() => setSelectedPDF(document)}
                    >
                      {document.name}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
