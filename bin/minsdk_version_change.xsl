<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:widget="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
  <xsl:output method="xml" indent="yes"/>
  <xsl:param name="version"/>

  <xsl:template match="node()|@*">
    <xsl:copy>
      <xsl:apply-templates select="node()|@*"/>
    </xsl:copy>
  </xsl:template>

  <xsl:template match="widget:preference[@name='android-minSdkVersion']/@value">
    <xsl:attribute name="value">
      <xsl:value-of select="$version"/>
    </xsl:attribute>
  </xsl:template>
  <xsl:template match="widget:preference[@name='minSdkVersion']/@value">
    <xsl:attribute name="value">
      <xsl:value-of select="$version"/>
    </xsl:attribute>
  </xsl:template>
</xsl:stylesheet>