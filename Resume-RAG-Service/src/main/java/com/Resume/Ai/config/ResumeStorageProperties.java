package com.Resume.Ai.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "resume.storage")
public class ResumeStorageProperties {

    /** Storage backend selector: {@code local}, {@code s3}, {@code r2}, etc. */
    private String type = "local";

    /** Root directory for the local storage implementation. */
    private String basePath = "./uploads/resumes";

    private Supabase supabase = new Supabase();

    public void setType(String type) {
        this.type = type;
    }

    public Supabase getSupabase() {
        return supabase;
    }

    public void setSupabase(Supabase supabase) {
        this.supabase = supabase;
    }

    public static class Supabase {

        private String url;
        private String serviceKey;
        private String bucket = "Resumes";

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }

        public String getServiceKey() {
            return serviceKey;
        }

        public void setServiceKey(String serviceKey) {
            this.serviceKey = serviceKey;
        }

        public String getBucket() {
            return bucket;
        }

        public void setBucket(String bucket) {
            this.bucket = bucket;
        }
    }
}
