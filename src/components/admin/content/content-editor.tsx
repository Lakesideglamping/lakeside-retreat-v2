"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs } from "@/components/admin/ui/tabs";
import { FormField } from "@/components/admin/ui/form-field";
import { Alert } from "@/components/admin/ui/alert";
import { LoadingSpinner } from "@/components/admin/ui/loading-spinner";
import { adminGet, adminPut } from "@/lib/admin-api";

interface ContentSection {
  key: string;
  label: string;
  fields: {
    settingKey: string;
    label: string;
    type: "text" | "textarea";
    placeholder?: string;
  }[];
}

const SECTIONS: ContentSection[] = [
  {
    key: "hero",
    label: "Hero",
    fields: [
      { settingKey: "content_hero_title", label: "Title", type: "text", placeholder: "Welcome to Lakeside Retreat" },
      { settingKey: "content_hero_subtitle", label: "Subtitle", type: "text", placeholder: "Your perfect getaway awaits" },
      { settingKey: "content_hero_cta_text", label: "CTA Button Text", type: "text", placeholder: "Book Now" },
      { settingKey: "content_hero_cta_link", label: "CTA Button Link", type: "text", placeholder: "/booking" },
    ],
  },
  {
    key: "about",
    label: "About",
    fields: [
      { settingKey: "content_about_title", label: "Title", type: "text", placeholder: "About Us" },
      { settingKey: "content_about_description", label: "Description", type: "textarea", placeholder: "Tell visitors about your property..." },
      { settingKey: "content_about_highlight_1", label: "Highlight 1", type: "text", placeholder: "Lakefront property" },
      { settingKey: "content_about_highlight_2", label: "Highlight 2", type: "text", placeholder: "Private dock" },
      { settingKey: "content_about_highlight_3", label: "Highlight 3", type: "text", placeholder: "Mountain views" },
    ],
  },
  {
    key: "accommodations",
    label: "Accommodations",
    fields: [
      { settingKey: "content_accommodations_title", label: "Section Title", type: "text", placeholder: "Our Accommodations" },
      { settingKey: "content_accommodations_description", label: "Section Description", type: "textarea", placeholder: "Choose from our selection of properties..." },
    ],
  },
  {
    key: "contact",
    label: "Contact",
    fields: [
      { settingKey: "content_contact_title", label: "Title", type: "text", placeholder: "Get in Touch" },
      { settingKey: "content_contact_description", label: "Description", type: "textarea", placeholder: "We would love to hear from you..." },
      { settingKey: "content_contact_email", label: "Email", type: "text", placeholder: "info@lakesideretreat.com" },
      { settingKey: "content_contact_phone", label: "Phone", type: "text", placeholder: "+1 (555) 123-4567" },
      { settingKey: "content_contact_address", label: "Address", type: "textarea", placeholder: "123 Lakeside Drive..." },
    ],
  },
  {
    key: "seo",
    label: "SEO",
    fields: [
      { settingKey: "content_seo_title", label: "Meta Title", type: "text", placeholder: "Lakeside Retreat - Vacation Rental" },
      { settingKey: "content_seo_description", label: "Meta Description", type: "textarea", placeholder: "Book your stay at our beautiful lakeside property..." },
      { settingKey: "content_seo_keywords", label: "Keywords", type: "text", placeholder: "vacation, lakeside, retreat, rental" },
      { settingKey: "content_seo_og_title", label: "OG Title", type: "text", placeholder: "Lakeside Retreat" },
      { settingKey: "content_seo_og_description", label: "OG Description", type: "textarea", placeholder: "Your perfect lakeside vacation..." },
    ],
  },
];

const TABS = SECTIONS.map((s) => ({ key: s.key, label: s.label }));

export function ContentEditor() {
  const [activeTab, setActiveTab] = useState("hero");
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGet<{ content: Record<string, string> }>(
        "/api/admin/content"
      );
      setContent(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load content");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleFieldChange = (settingKey: string, value: string) => {
    setContent((prev) => ({ ...prev, [settingKey]: value }));
  };

  const handleSaveSection = async () => {
    const section = SECTIONS.find((s) => s.key === activeTab);
    if (!section) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const sections: Record<string, string> = {};
      for (const field of section.fields) {
        sections[field.settingKey] = content[field.settingKey] ?? "";
      }

      await adminPut("/api/admin/content", { sections });
      setSuccess(`${section.label} section saved successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save content");
    } finally {
      setSaving(false);
    }
  };

  const currentSection = SECTIONS.find((s) => s.key === activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Edit website content sections
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onDismiss={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {/* Section editor */}
      {currentSection && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {currentSection.label} Section
            </h2>
            <button
              onClick={handleSaveSection}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2d5a5a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#234848] disabled:opacity-50"
            >
              {saving && <LoadingSpinner size="sm" className="text-white" />}
              Save {currentSection.label}
            </button>
          </div>

          <div className="space-y-5">
            {currentSection.fields.map((field) => (
              <FormField
                key={field.settingKey}
                label={field.label}
                name={field.settingKey}
                type={field.type}
                value={content[field.settingKey] ?? ""}
                onChange={(v) => handleFieldChange(field.settingKey, v)}
                placeholder={field.placeholder}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
