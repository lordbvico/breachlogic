# Add project specific ProGuard rules here.
# For more details, see http://developer.android.com/guide/developing/tools/proguard.html

# Preserve line number information for debugging stack traces.
-keepattributes SourceFile,LineNumberTable

# Preserve Annotations for library support
-keepattributes *Annotation*

# Capacitor specific rules
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.community.** { *; }

# Keep JavaScript Interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve GMS and Firebase classes if used
-keep class com.google.android.gms.** { *; }
-keep class com.google.firebase.** { *; }

# If you use Gson or similar for JSON serialization
-keepattributes Signature
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}
