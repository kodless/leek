FROM opensearchproject/opensearch:1.3.1
RUN /usr/share/opensearch/bin/opensearch-plugin remove opensearch-security
COPY --chown=opensearch:opensearch conf/elasticsearch.yml /usr/share/opensearch/config/
